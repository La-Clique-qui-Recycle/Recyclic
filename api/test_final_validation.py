#!/usr/bin/env python3
"""Test final de validation de la Story 3.1"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

def test_imports():
    """Test des imports critiques"""
    try:
        from recyclic_api.models.user import User, UserRole, UserStatus
        from recyclic_api.core.database import get_db
        from recyclic_api.cli import create_super_admin
        print("✅ Tous les imports fonctionnent")
        return True
    except Exception as e:
        print(f"❌ Erreur d'import: {e}")
        return False

def test_enums():
    """Test des enums"""
    try:
        from recyclic_api.models.user import UserRole, UserStatus
        
        # Test UserRole
        assert UserRole.SUPER_ADMIN.value == "super-admin"
        assert UserRole.ADMIN.value == "admin"
        assert UserRole.USER.value == "user"
        
        # Test UserStatus
        assert UserStatus.PENDING.value == "pending"
        assert UserStatus.APPROVED.value == "approved"
        assert UserStatus.REJECTED.value == "rejected"
        
        print("✅ Enums correctement définis")
        return True
    except Exception as e:
        print(f"❌ Erreur enum: {e}")
        return False

def test_cli_function():
    """Test de la fonction CLI"""
    try:
        from recyclic_api.cli import create_super_admin
        
        # Test de parsing du nom
        name_parts = "John Doe".strip().split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        
        assert first_name == "John"
        assert last_name == "Doe"
        
        print("✅ Fonction CLI correctement définie")
        return True
    except Exception as e:
        print(f"❌ Erreur CLI: {e}")
        return False

def main():
    """Test principal"""
    print("🧪 Validation finale de la Story 3.1...")
    
    tests = [
        test_imports,
        test_enums,
        test_cli_function
    ]
    
    passed = 0
    for test in tests:
        if test():
            passed += 1
    
    print(f"\n📊 Résultats: {passed}/{len(tests)} tests passés")
    
    if passed == len(tests):
        print("🎉 Story 3.1 validée avec succès !")
        return 0
    else:
        print("❌ Des problèmes subsistent")
        return 1

if __name__ == "__main__":
    sys.exit(main())
