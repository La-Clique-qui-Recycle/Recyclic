#!/usr/bin/env python3
"""
Script de validation post-migration pour vérifier l'intégrité des données migrées.
"""

import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configuration de la base de données
DATABASE_URL = "postgresql://recyclic:postgres@localhost:5432/recyclic"

def validate_migration_post():
    """Valide l'intégrité des données après migration."""
    
    # Connexion à la base de données
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    validation_results = {
        "passed": 0,
        "failed": 0,
        "warnings": 0,
        "errors": []
    }
    
    try:
        print("🔍 Validation post-migration des données...")
        
        # 1. Vérifier que la table categories existe
        print("\n1. Vérification de l'existence de la table categories...")
        
        categories_exists = session.execute(text("""
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_name = 'categories' AND table_schema = 'public'
        """)).scalar() > 0
        
        if categories_exists:
            print("✅ Table categories existe")
            validation_results["passed"] += 1
        else:
            print("❌ Table categories n'existe pas")
            validation_results["failed"] += 1
            validation_results["errors"].append("Table categories manquante")
        
        if not categories_exists:
            return validation_results
        
        # 2. Vérifier le nombre de catégories
        print("\n2. Vérification du nombre de catégories...")
        
        categories_count = session.execute(text("SELECT COUNT(*) FROM categories WHERE is_active = true")).scalar()
        
        print(f"📊 categories (actives): {categories_count}")
        
        if categories_count > 0:
            print("✅ Catégories présentes dans la table")
            validation_results["passed"] += 1
        else:
            print("❌ Aucune catégorie active trouvée")
            validation_results["failed"] += 1
            validation_results["errors"].append("Aucune catégorie active trouvée")
        
        # 3. Vérifier la structure des catégories
        print("\n3. Vérification de la structure des catégories...")
        
        # Vérifier que les catégories ont des noms non vides
        empty_names = session.execute(text("""
            SELECT COUNT(*) FROM categories 
            WHERE name IS NULL OR name = ''
        """)).scalar()
        
        if empty_names == 0:
            print("✅ Toutes les catégories ont des noms valides")
            validation_results["passed"] += 1
        else:
            print(f"❌ {empty_names} catégories ont des noms vides")
            validation_results["failed"] += 1
            validation_results["errors"].append(f"{empty_names} catégories ont des noms vides")
        
        # 4. Vérifier les contraintes d'intégrité
        print("\n4. Vérification des contraintes d'intégrité...")
        
        # Vérifier que les catégories actives ont des slugs uniques
        duplicate_slugs = session.execute(text("""
            SELECT slug, COUNT(*) as count 
            FROM categories 
            WHERE is_active = true 
            GROUP BY slug 
            HAVING COUNT(*) > 1
        """)).fetchall()
        
        if not duplicate_slugs:
            print("✅ Tous les slugs sont uniques")
            validation_results["passed"] += 1
        else:
            print(f"❌ {len(duplicate_slugs)} slugs dupliqués trouvés")
            validation_results["failed"] += 1
            validation_results["errors"].append(f"{len(duplicate_slugs)} slugs dupliqués")
        
        # 5. Vérifier les relations avec ligne_depot
        print("\n5. Vérification des relations avec ligne_depot...")
        
        orphaned_lines = session.execute(text("""
            SELECT COUNT(*) FROM ligne_depot ld
            LEFT JOIN categories c ON ld.category_id = c.id
            WHERE c.id IS NULL
        """)).scalar()
        
        if orphaned_lines == 0:
            print("✅ Toutes les lignes de dépôt ont des catégories valides")
            validation_results["passed"] += 1
        else:
            print(f"❌ {orphaned_lines} lignes de dépôt orphelines trouvées")
            validation_results["failed"] += 1
            validation_results["errors"].append(f"{orphaned_lines} lignes de dépôt orphelines")
        
        # 6. Résumé final
        print("\n" + "="*50)
        print("📊 RÉSUMÉ DE LA VALIDATION")
        print("="*50)
        print(f"✅ Tests réussis: {validation_results['passed']}")
        print(f"❌ Tests échoués: {validation_results['failed']}")
        print(f"⚠️  Avertissements: {validation_results['warnings']}")
        
        if validation_results['errors']:
            print("\n🚨 ERREURS DÉTECTÉES:")
            for error in validation_results['errors']:
                print(f"  - {error}")
        
        if validation_results['failed'] == 0:
            print("\n🎉 VALIDATION RÉUSSIE - Migration complète et cohérente!")
        else:
            print(f"\n💥 VALIDATION ÉCHOUÉE - {validation_results['failed']} problème(s) détecté(s)")
        
        return validation_results
        
    except Exception as e:
        print(f"❌ Erreur lors de la validation: {e}")
        validation_results["failed"] += 1
        validation_results["errors"].append(f"Erreur de validation: {str(e)}")
        return validation_results
    
    finally:
        session.close()

if __name__ == "__main__":
    results = validate_migration_post()
    sys.exit(0 if results["failed"] == 0 else 1)