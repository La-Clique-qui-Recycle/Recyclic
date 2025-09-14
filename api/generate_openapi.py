#!/usr/bin/env python3
"""
Script pour générer le fichier openapi.json à partir de l'API FastAPI
"""
import sys
import json
import os

# Ajouter le répertoire src au path
sys.path.append('src')

from recyclic_api.main import app

def generate_openapi():
    """Génère le fichier openapi.json"""
    try:
        openapi_spec = app.openapi()
        
        # Écrire le fichier
        with open('openapi.json', 'w', encoding='utf-8') as f:
            json.dump(openapi_spec, f, indent=2, ensure_ascii=False)
        
        print("✅ openapi.json généré avec succès")
        print(f"📊 Titre: {openapi_spec.get('info', {}).get('title', 'N/A')}")
        print(f"📊 Version: {openapi_spec.get('info', {}).get('version', 'N/A')}")
        print(f"📊 Endpoints: {len(openapi_spec.get('paths', {}))}")
        print(f"📊 Schémas: {len(openapi_spec.get('components', {}).get('schemas', {}))}")
        
        return True
    except Exception as e:
        print(f"❌ Erreur lors de la génération: {e}")
        return False

if __name__ == "__main__":
    generate_openapi()
