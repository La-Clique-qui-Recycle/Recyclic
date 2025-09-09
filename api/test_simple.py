#!/usr/bin/env python3
"""Test simple de la CLI create-super-admin"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from recyclic_api.cli import create_super_admin

def test_create_super_admin():
    """Test de création d'un super admin"""
    print("🧪 Test de création d'un super admin...")
    
    try:
        # Test avec des données valides
        create_super_admin("123456789", "John Doe")
        print("✅ Super admin créé avec succès !")
        
        # Vérifier que l'utilisateur existe
        from recyclic_api.core.database import get_db
        from recyclic_api.models.user import User, UserRole, UserStatus
        
        db = next(get_db())
        user = db.query(User).filter(User.telegram_id == "123456789").first()
        
        if user:
            print(f"✅ Utilisateur trouvé: {user.first_name} {user.last_name}")
            print(f"   Role: {user.role}")
            print(f"   Status: {user.status}")
            print(f"   Actif: {user.is_active}")
        else:
            print("❌ Utilisateur non trouvé")
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_create_super_admin()
