#!/usr/bin/env python3
"""
Script de vérification de l'état de la migration P2 Data Migration
Vérifie l'état de la base de données et des migrations Alembic
"""

import os
import sys
import subprocess
import psycopg2
from pathlib import Path

def check_docker_services():
    """Vérifier si les services Docker sont en cours d'exécution"""
    print("🔍 Vérification des services Docker...")
    
    try:
        # Vérifier si Docker est en cours d'exécution
        result = subprocess.run(['docker', 'ps'], capture_output=True, text=True, timeout=10)
        if result.returncode != 0:
            print("❌ Docker n'est pas accessible ou n'est pas en cours d'exécution")
            return False
        
        # Vérifier les services spécifiques
        services = ['postgres', 'redis', 'api']
        running_services = []
        
        for line in result.stdout.split('\n'):
            for service in services:
                if service in line and 'Up' in line:
                    running_services.append(service)
        
        print(f"✅ Services Docker en cours d'exécution: {', '.join(running_services)}")
        return len(running_services) > 0
        
    except subprocess.TimeoutExpired:
        print("❌ Timeout lors de la vérification des services Docker")
        return False
    except Exception as e:
        print(f"❌ Erreur lors de la vérification des services Docker: {e}")
        return False

def check_database_connection():
    """Vérifier la connexion à la base de données"""
    print("\n🔍 Vérification de la connexion à la base de données...")
    
    try:
        # Lire les variables d'environnement
        postgres_password = os.getenv('POSTGRES_PASSWORD', 'your_postgres_password')
        
        # Connexion à la base de données
        conn = psycopg2.connect(
            host='localhost',
            port=5432,
            database='recyclic',
            user='recyclic',
            password=postgres_password
        )
        
        cursor = conn.cursor()
        
        # Vérifier si la table dom_category existe
        cursor.execute("""
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_name = 'dom_category' AND table_schema = 'public'
        """)
        dom_category_exists = cursor.fetchone()[0] > 0
        
        # Vérifier si la table categories existe
        cursor.execute("""
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_name = 'categories' AND table_schema = 'public'
        """)
        categories_exists = cursor.fetchone()[0] > 0
        
        print(f"✅ Connexion à la base de données réussie")
        print(f"📊 Table dom_category existe: {'Oui' if dom_category_exists else 'Non'}")
        print(f"📊 Table categories existe: {'Oui' if categories_exists else 'Non'}")
        
        if dom_category_exists:
            # Compter les enregistrements dans dom_category
            cursor.execute("SELECT COUNT(*) FROM dom_category")
            dom_category_count = cursor.fetchone()[0]
            print(f"📊 Nombre d'enregistrements dans dom_category: {dom_category_count}")
            
            # Compter les catégories de niveau 1
            cursor.execute("SELECT COUNT(*) FROM dom_category WHERE level = 1")
            level1_count = cursor.fetchone()[0]
            print(f"📊 Catégories de niveau 1 dans dom_category: {level1_count}")
        
        if categories_exists:
            # Compter les enregistrements dans categories
            cursor.execute("SELECT COUNT(*) FROM categories")
            categories_count = cursor.fetchone()[0]
            print(f"📊 Nombre d'enregistrements dans categories: {categories_count}")
            
            # Compter les catégories actives
            cursor.execute("SELECT COUNT(*) FROM categories WHERE is_active = true")
            active_count = cursor.fetchone()[0]
            print(f"📊 Catégories actives dans categories: {active_count}")
        
        cursor.close()
        conn.close()
        
        return True, dom_category_exists, categories_exists
        
    except psycopg2.OperationalError as e:
        print(f"❌ Impossible de se connecter à la base de données: {e}")
        return False, False, False
    except Exception as e:
        print(f"❌ Erreur lors de la vérification de la base de données: {e}")
        return False, False, False

def check_alembic_status():
    """Vérifier l'état des migrations Alembic"""
    print("\n🔍 Vérification de l'état des migrations Alembic...")
    
    try:
        # Changer vers le répertoire api
        api_dir = Path('api')
        if not api_dir.exists():
            print("❌ Répertoire api introuvable")
            return False
        
        # Vérifier l'état actuel des migrations
        result = subprocess.run(
            ['alembic', 'current'],
            cwd=api_dir,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print(f"✅ État actuel des migrations: {result.stdout.strip()}")
        else:
            print(f"❌ Erreur lors de la vérification des migrations: {result.stderr}")
            return False
        
        # Vérifier l'historique des migrations
        result = subprocess.run(
            ['alembic', 'history', '--verbose'],
            cwd=api_dir,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print("✅ Historique des migrations disponible")
            # Afficher les dernières migrations
            lines = result.stdout.split('\n')
            for line in lines[-10:]:  # Dernières 10 lignes
                if line.strip():
                    print(f"   {line}")
        else:
            print(f"❌ Erreur lors de la vérification de l'historique: {result.stderr}")
            return False
        
        return True
        
    except subprocess.TimeoutExpired:
        print("❌ Timeout lors de la vérification des migrations Alembic")
        return False
    except Exception as e:
        print(f"❌ Erreur lors de la vérification des migrations Alembic: {e}")
        return False

def main():
    """Fonction principale"""
    print("🚀 Vérification de l'état de la migration P2 Data Migration")
    print("=" * 60)
    
    # Vérifier les services Docker
    docker_ok = check_docker_services()
    
    if not docker_ok:
        print("\n❌ Les services Docker ne sont pas en cours d'exécution")
        print("💡 Veuillez démarrer les services avec: docker-compose up -d")
        return
    
    # Vérifier la base de données
    db_ok, dom_category_exists, categories_exists = check_database_connection()
    
    if not db_ok:
        print("\n❌ Impossible de se connecter à la base de données")
        return
    
    # Vérifier les migrations Alembic
    alembic_ok = check_alembic_status()
    
    if not alembic_ok:
        print("\n❌ Problème avec les migrations Alembic")
        return
    
    # Résumé de l'état
    print("\n" + "=" * 60)
    print("📋 RÉSUMÉ DE L'ÉTAT")
    print("=" * 60)
    
    if dom_category_exists and not categories_exists:
        print("🔄 ÉTAT: Migration nécessaire")
        print("💡 Les données de dom_category doivent être migrées vers categories")
        print("💡 Exécutez: cd api && alembic upgrade head")
    elif dom_category_exists and categories_exists:
        print("✅ ÉTAT: Migration partiellement terminée")
        print("💡 Vérifiez que toutes les données ont été migrées")
    elif not dom_category_exists and categories_exists:
        print("✅ ÉTAT: Migration terminée")
        print("💡 Les données ont été migrées et dom_category a été supprimée")
    else:
        print("❓ ÉTAT: Inconnu")
        print("💡 Vérifiez manuellement l'état de la base de données")

if __name__ == "__main__":
    main()
