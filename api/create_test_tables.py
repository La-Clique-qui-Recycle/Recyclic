#!/usr/bin/env python3
"""
Script pour créer les tables dans la base de données de test
"""
import os
import sys
from pathlib import Path

# Ajouter la racine du projet au PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine
from recyclic_api.core.database import Base

# Configuration de la base de données de test
database_url = os.getenv("TEST_DATABASE_URL", "postgresql://recyclic:postgres@postgres:5432/recyclic_test")

def create_test_tables():
    """Créer les tables dans la base de données de test"""
    print(f"🔧 Connexion à la base de données: {database_url}")

    # Créer le moteur
    engine = create_engine(database_url)

    try:
        print("🔧 Création des tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tables créées avec succès dans la base de données de test")
    except Exception as e:
        print(f"❌ Erreur lors de la création des tables: {e}")
        return False

    # Vérifier les tables créées
    try:
        with engine.connect() as conn:
            result = conn.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'")
            tables = [row[0] for row in result]
            print(f"📋 Tables créées: {', '.join(tables)}")

            if 'users' in tables:
                print("✅ Table 'users' créée avec succès")
                return True
            else:
                print("❌ Table 'users' manquante")
                return False

    except Exception as e:
        print(f"❌ Erreur lors de la vérification des tables: {e}")
        return False

if __name__ == "__main__":
    success = create_test_tables()
    if success:
        print("🎉 Base de données de test prête pour les tests")
        sys.exit(0)
    else:
        print("💥 Échec de la création des tables")
        sys.exit(1)

