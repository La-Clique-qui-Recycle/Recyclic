#!/usr/bin/env python3
"""
Script pour corriger l'état des migrations Alembic
"""
import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Configuration de la base de données
DATABASE_URL = "postgresql://recyclic:recyclic_secure_password_2024@localhost:5432/recyclic"

def fix_migration_state():
    """Corrige l'état des migrations en mettant à jour la table alembic_version"""
    try:
        # Connexion à la base de données
        conn = psycopg2.connect(DATABASE_URL)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Vérifier l'état actuel
        cursor.execute("SELECT version_num FROM alembic_version;")
        current_version = cursor.fetchone()[0]
        print(f"Version actuelle: {current_version}")
        
        # Mettre à jour vers la version correcte
        new_version = "afbbc7f0e804"
        cursor.execute(f"UPDATE alembic_version SET version_num = '{new_version}';")
        print(f"Version mise à jour vers: {new_version}")
        
        # Vérifier que la table cash_sessions existe
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'cash_sessions';
        """)
        result = cursor.fetchone()
        if result:
            print("✅ Table cash_sessions existe")
        else:
            print("❌ Table cash_sessions n'existe pas")
        
        cursor.close()
        conn.close()
        print("✅ État des migrations corrigé avec succès")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fix_migration_state()
