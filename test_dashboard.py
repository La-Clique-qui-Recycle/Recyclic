#!/usr/bin/env python3
"""Script pour tester l'endpoint dashboard avec authentification."""

import requests
import json
import uuid
import jwt
from datetime import datetime, timedelta

# Configuration
API_BASE_URL = "http://localhost:8000"
SECRET_KEY = "your-secret-key-here"  # Utilisez la même clé que dans l'API

def create_test_token():
    """Crée un token JWT de test."""
    payload = {
        "sub": str(uuid.uuid4()),
        "exp": datetime.utcnow() + timedelta(hours=1),
        "iat": datetime.utcnow()
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token

def test_dashboard_endpoint():
    """Teste l'endpoint dashboard."""
    token = create_test_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    url = f"{API_BASE_URL}/api/v1/admin/dashboard/stats"
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Endpoint dashboard fonctionne !")
        elif response.status_code == 401:
            print("❌ Erreur d'authentification")
        elif response.status_code == 403:
            print("❌ Accès refusé - permissions insuffisantes")
        elif response.status_code == 404:
            print("❌ Endpoint non trouvé")
        else:
            print(f"❌ Erreur inattendue: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur de connexion: {e}")

if __name__ == "__main__":
    test_dashboard_endpoint()
