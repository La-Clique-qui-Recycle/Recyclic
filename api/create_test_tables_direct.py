#!/usr/bin/env python3
"""
Script direct pour créer les tables dans la base de données de test
"""
import os
import sys
sys.path.append('src')

from sqlalchemy import create_engine, text
from recyclic_api.core.database import Base
from recyclic_api.models import *

def create_tables_direct():
    """Créer les tables directement dans la base de données de test"""
    # Configuration de la base de données de test
    SQLALCHEMY_DATABASE_URL = "postgresql://recyclic:recyclic_secure_password_2024@postgres:5432/recyclic_test"
    os.environ["TESTING"] = "true"
    
    print("🔧 Connexion à la base de données de test...")
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    print("🔧 Création des tables...")
    Base.metadata.create_all(bind=engine)
    
    print("🔧 Vérification des tables créées...")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = [row[0] for row in result]
        print(f"✅ Tables trouvées: {tables}")
        
        if 'users' in tables:
            print("✅ Table 'users' créée avec succès")
        else:
            print("❌ Table 'users' manquante")
            
        if 'sites' in tables:
            print("✅ Table 'sites' créée avec succès")
        else:
            print("❌ Table 'sites' manquante")

if __name__ == "__main__":
    create_tables_direct()
