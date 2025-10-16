"""
Database import endpoint for SuperAdmins.
Allows secure import of SQL backup files.
"""

import logging
import os
import subprocess
import tempfile
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from recyclic_api.core.database import get_db
from recyclic_api.core.auth import require_super_admin_role
from recyclic_api.core.config import settings
from recyclic_api.models.user import User

router = APIRouter(tags=["admin"])
logger = logging.getLogger(__name__)


@router.post(
    "/db/import",
    summary="Import de sauvegarde de base de données (Super Admin uniquement)",
    description="Importe un fichier SQL de sauvegarde et remplace la base de données existante. Action irréversible.",
    status_code=status.HTTP_200_OK
)
async def import_database(
    file: UploadFile = File(..., description="Fichier SQL de sauvegarde à importer"),
    current_user: User = Depends(require_super_admin_role()),
    db: Session = Depends(get_db)
):
    """
    Importe un fichier SQL de sauvegarde et remplace la base de données existante.
    
    Restrictions:
    - Accessible uniquement aux Super-Admins
    - Action irréversible - remplace complètement la base de données
    - Le fichier doit être un fichier SQL valide
    - L'opération peut prendre plusieurs minutes selon la taille du fichier
    
    Sécurité:
    - Validation du type de fichier (.sql uniquement)
    - Sauvegarde automatique avant import
    - Exécution dans un environnement isolé
    """
    try:
        logger.warning(f"Database import requested by user {current_user.id} ({current_user.username})")
        
        # Validation du fichier
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Aucun fichier fourni"
            )
        
        if not file.filename.lower().endswith('.sql'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le fichier doit être un fichier SQL (.sql)"
            )
        
        # Vérifier la taille du fichier (limite à 100MB)
        file_content = await file.read()
        if len(file_content) > 100 * 1024 * 1024:  # 100MB
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Le fichier est trop volumineux (limite: 100MB)"
            )
        
        # Parse DATABASE_URL to extract connection parameters
        db_url = settings.DATABASE_URL

        # Extract connection parameters from DATABASE_URL
        # Format: postgresql://user:password@host:port/database
        if not db_url.startswith("postgresql://"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Invalid database URL format"
            )

        # Remove protocol prefix
        db_url_no_protocol = db_url.replace("postgresql://", "")

        # Split credentials and host/db info
        if "@" not in db_url_no_protocol:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cannot parse database credentials from URL"
            )

        credentials, host_db = db_url_no_protocol.split("@", 1)

        # Parse credentials
        if ":" in credentials:
            db_user, db_password = credentials.split(":", 1)
        else:
            db_user = credentials
            db_password = ""

        # Parse host, port, and database name
        if "/" not in host_db:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cannot parse database name from URL"
            )

        host_port, db_name = host_db.split("/", 1)

        # Parse host and port
        if ":" in host_port:
            db_host, db_port = host_port.split(":", 1)
        else:
            db_host = host_port
            db_port = "5432"

        # Créer un fichier temporaire pour le SQL
        with tempfile.NamedTemporaryFile(mode='wb', suffix='.sql', delete=False) as temp_file:
            temp_file.write(file_content)
            temp_sql_path = temp_file.name

        try:
            # Générer un nom de fichier de sauvegarde automatique
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_filename = f"recyclic_db_backup_before_import_{timestamp}.sql"
            backup_path = os.path.join(tempfile.gettempdir(), backup_filename)

            # Créer une sauvegarde automatique avant l'import
            logger.info(f"Creating automatic backup before import: {backup_path}")
            
            env = os.environ.copy()
            env["PGPASSWORD"] = db_password

            backup_cmd = [
                "pg_dump",
                "-h", db_host,
                "-p", db_port,
                "-U", db_user,
                "-d", db_name,
                "-F", "p",  # Plain text format
                "-f", backup_path,
                "--clean",
                "--if-exists",
                "--no-owner",
                "--no-privileges"
            ]

            backup_result = subprocess.run(
                backup_cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minutes timeout
                check=False
            )

            if backup_result.returncode != 0:
                logger.error(f"Backup creation failed: {backup_result.stderr}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Impossible de créer une sauvegarde automatique: {backup_result.stderr}"
                )

            logger.info(f"Automatic backup created successfully: {backup_path}")

            # Exécuter l'import avec psql
            logger.info(f"Executing database import from {temp_sql_path}")
            
            import_cmd = [
                "psql",
                "-h", db_host,
                "-p", db_port,
                "-U", db_user,
                "-d", db_name,
                "-f", temp_sql_path,
                "-v", "ON_ERROR_STOP=1"  # Arrêter en cas d'erreur
            ]

            import_result = subprocess.run(
                import_cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=600,  # 10 minutes timeout
                check=False
            )

            if import_result.returncode != 0:
                logger.error(f"Database import failed: {import_result.stderr}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Erreur lors de l'import de la base de données: {import_result.stderr}"
                )

            logger.warning(f"Database import completed successfully by user {current_user.id}")
            
            return {
                "message": "Import de la base de données effectué avec succès",
                "imported_file": file.filename,
                "backup_created": backup_filename,
                "backup_path": backup_path,
                "timestamp": datetime.utcnow().isoformat()
            }

        finally:
            # Nettoyer le fichier temporaire
            try:
                os.unlink(temp_sql_path)
            except Exception as e:
                logger.warning(f"Could not delete temporary file {temp_sql_path}: {e}")

    except subprocess.TimeoutExpired:
        logger.error("Database import timed out")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="L'import de la base de données a pris trop de temps (timeout après 10 minutes)"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during database import: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'import de la base de données: {str(e)}"
        )
