#!/usr/bin/env python3
"""Test final de la CLI create-super-admin"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

def test_cli():
    """Test de la CLI create-super-admin"""
    print("🧪 Test de la CLI create-super-admin...")
    
    try:
        # Import des modules
        from recyclic_api.cli import create_super_admin
        print("✅ Import des modules réussi")
        
        # Test de création d'un super admin
        print("📝 Création d'un super admin...")
        create_super_admin("555666777", "Alice Martin")
        print("✅ Super admin créé avec succès !")
        
        # Vérification en base
        from recyclic_api.core.database import get_db
        from recyclic_api.models.user import User
        
        print("🔍 Vérification en base de données...")
        db = next(get_db())
        user = db.query(User).filter(User.telegram_id == "555666777").first()
        
        if user:
            print(f"✅ Utilisateur trouvé: {user.first_name} {user.last_name}")
            print(f"   Role: {user.role}")
            print(f"   Status: {user.status}")
            print(f"   Actif: {user.is_active}")
            print("🎉 Test réussi !")
        else:
            print("❌ Utilisateur non trouvé en base")
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_cli()
