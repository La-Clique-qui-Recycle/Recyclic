#!/usr/bin/env python3
"""
Script de validation des migrations Alembic.
Vérifie l'ordre, la cohérence et la validité des migrations.
"""
import subprocess
import sys
from pathlib import Path


def run_command(cmd, description):
    """Exécute une commande et retourne le résultat."""
    print(f"🔍 {description}...")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"✅ {description} - Succès")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Échec: {e.stderr}")
        return None


def main():
    """Fonction principale de validation."""
    print("🧪 Validation des migrations Alembic...")
    
    # Vérifier que nous sommes dans le bon répertoire
    if not Path("alembic.ini").exists():
        print("❌ Fichier alembic.ini non trouvé. Exécutez ce script depuis le répertoire api/")
        sys.exit(1)
    
    # Test 1: Vérifier l'ordre des migrations
    stdout = run_command(["alembic", "history", "--verbose"], "Vérification de l'ordre des migrations")
    if stdout is None:
        sys.exit(1)
    
    # Test 2: Vérifier les têtes de migration
    stdout = run_command(["alembic", "heads"], "Vérification des têtes de migration")
    if stdout is None:
        sys.exit(1)
    
    # Vérifier qu'il n'y a qu'une seule tête
    heads = [line.strip() for line in stdout.split('\n') if line.strip()]
    if len(heads) != 1:
        print(f"❌ Plusieurs têtes de migration détectées: {heads}")
        sys.exit(1)
    else:
        print(f"✅ Tête de migration unique: {heads[0]}")
    
    # Test 3: Vérifier l'état actuel
    stdout = run_command(["alembic", "current"], "Vérification de l'état actuel")
    if stdout is None:
        sys.exit(1)
    
    # Test 4: Vérifier la syntaxe des fichiers de migration
    migrations_dir = Path("migrations/versions")
    if not migrations_dir.exists():
        print("❌ Répertoire migrations/versions non trouvé")
        sys.exit(1)
    
    print("🔍 Vérification de la syntaxe des fichiers de migration...")
    migration_files = list(migrations_dir.glob("*.py"))
    migration_files = [f for f in migration_files if not f.name.startswith("__")]
    
    for migration_file in migration_files:
        result = subprocess.run(
            ["python", "-m", "py_compile", str(migration_file)],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print(f"❌ Erreur de syntaxe dans {migration_file}: {result.stderr}")
            sys.exit(1)
        else:
            print(f"✅ {migration_file.name} - Syntaxe valide")
    
    # Test 5: Vérifier les dépendances
    stdout = run_command(["alembic", "show", "head"], "Vérification des dépendances")
    if stdout is None:
        sys.exit(1)
    
    print("\n🎉 Toutes les validations ont réussi !")
    print("✅ Les migrations sont prêtes pour le déploiement")


if __name__ == "__main__":
    main()
