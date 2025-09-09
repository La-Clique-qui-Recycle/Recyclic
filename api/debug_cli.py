#!/usr/bin/env python3
"""Debug de la CLI"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

print("🔍 Debug de la CLI...")

try:
    print("1. Import des modules...")
    from recyclic_api.cli import create_super_admin
    print("✅ Import réussi")
    
    print("2. Test de création...")
    create_super_admin("999888777", "Test User")
    print("✅ Création réussie")
    
except Exception as e:
    print(f"❌ Erreur: {e}")
    import traceback
    traceback.print_exc()
