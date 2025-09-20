#!/usr/bin/env python3
"""
Test simple pour isoler le problème d'import des modèles
"""

import sys
import os

# Ajouter le répertoire src au path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

try:
    print("1. Import de la base de données...")
    from recyclic_api.core.database import Base
    print("✅ Base importée avec succès")
    
    print("2. Import des modèles individuels...")
    from recyclic_api.models.user import User
    print("✅ User importé avec succès")
    
    from recyclic_api.models.login_history import LoginHistory
    print("✅ LoginHistory importé avec succès")
    
    print("3. Import de l'application FastAPI...")
    from recyclic_api.main import app
    print("✅ Application FastAPI importée avec succès")
    
    print("4. Test de création des tables...")
    # Test de création des tables avec PostgreSQL
    from sqlalchemy import create_engine
    from recyclic_api.core.config import settings
    
    # Utiliser PostgreSQL pour le test
    test_engine = create_engine("postgresql://recyclic:recyclic_secure_password_2024@postgres:5432/recyclic_test")
    Base.metadata.create_all(bind=test_engine)
    print("✅ Tables créées avec succès")
    
    print("\n🎉 Tous les imports fonctionnent correctement !")
    
except Exception as e:
    print(f"❌ Erreur lors de l'import: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
