#!/usr/bin/env python3
"""Test direct de la CLI"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Test direct de la fonction
def test_direct():
    try:
        from recyclic_api.cli import create_super_admin
        print("✅ Import réussi")
        
        # Test de création
        create_super_admin("987654321", "Jane Smith")
        print("✅ Super admin créé avec succès !")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_direct()
