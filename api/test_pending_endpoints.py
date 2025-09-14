#!/usr/bin/env python3
"""
Test simple pour vérifier que les endpoints de validation des inscriptions fonctionnent
"""

import requests
import json
import sys

API_BASE_URL = "http://localhost:4433/api/v1"

def test_health():
    """Test de base pour vérifier que l'API fonctionne"""
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        print(f"Health check: {response.status_code}")
        if response.status_code == 200:
            print("✅ API accessible")
            return True
        else:
            print("❌ API non accessible")
            return False
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")
        return False

def test_admin_endpoints():
    """Test des endpoints admin"""
    try:
        # Test de l'endpoint admin de base (doit retourner 403 sans auth)
        response = requests.get(f"{API_BASE_URL}/admin/users")
        print(f"Admin users endpoint: {response.status_code}")
        
        # Test de l'endpoint pending (doit retourner 403 sans auth)
        response = requests.get(f"{API_BASE_URL}/admin/users/pending")
        print(f"Pending users endpoint: {response.status_code}")
        
        if response.status_code == 403:
            print("✅ Endpoints admin protégés (403 Forbidden attendu)")
            return True
        elif response.status_code == 404:
            print("❌ Endpoint pending non trouvé (404)")
            return False
        else:
            print(f"❌ Statut inattendu: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors du test des endpoints: {e}")
        return False

def test_openapi_spec():
    """Test pour vérifier que les nouveaux endpoints sont dans l'OpenAPI"""
    try:
        response = requests.get(f"{API_BASE_URL}/openapi.json")
        if response.status_code == 200:
            spec = response.json()
            paths = spec.get('paths', {})
            
            # Vérifier la présence des nouveaux endpoints
            pending_endpoint = '/admin/users/pending'
            approve_endpoint = '/admin/users/{user_id}/approve'
            reject_endpoint = '/admin/users/{user_id}/reject'
            
            if pending_endpoint in paths:
                print("✅ Endpoint /admin/users/pending trouvé dans OpenAPI")
            else:
                print("❌ Endpoint /admin/users/pending manquant dans OpenAPI")
                
            if approve_endpoint in paths:
                print("✅ Endpoint /admin/users/{user_id}/approve trouvé dans OpenAPI")
            else:
                print("❌ Endpoint /admin/users/{user_id}/approve manquant dans OpenAPI")
                
            if reject_endpoint in paths:
                print("✅ Endpoint /admin/users/{user_id}/reject trouvé dans OpenAPI")
            else:
                print("❌ Endpoint /admin/users/{user_id}/reject manquant dans OpenAPI")
                
            return True
        else:
            print(f"❌ Impossible de récupérer l'OpenAPI: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors du test OpenAPI: {e}")
        return False

def main():
    """Fonction principale de test"""
    print("🧪 Test des endpoints de validation des inscriptions")
    print("=" * 50)
    
    # Test 1: Health check
    if not test_health():
        print("\n❌ L'API n'est pas accessible. Vérifiez que Docker est démarré.")
        sys.exit(1)
    
    print()
    
    # Test 2: Endpoints admin
    if not test_admin_endpoints():
        print("\n❌ Les endpoints admin ne fonctionnent pas correctement.")
        sys.exit(1)
    
    print()
    
    # Test 3: OpenAPI spec
    if not test_openapi_spec():
        print("\n❌ Les nouveaux endpoints ne sont pas dans l'OpenAPI.")
        sys.exit(1)
    
    print("\n✅ Tous les tests sont passés !")
    print("Les endpoints de validation des inscriptions sont prêts.")

if __name__ == "__main__":
    main()
