#!/usr/bin/env python3
"""Test de la CLI dans Docker"""

import subprocess
import sys

def test_docker_cli():
    """Test de la CLI via Docker"""
    print("🐳 Test de la CLI via Docker...")
    
    # Commande Docker pour tester la CLI
    cmd = [
        "docker", "run", "--rm", 
        "--network", "recyclic_default",
        "-e", "DATABASE_URL=postgresql://recyclic:recyclic@postgres:5432/recyclic",
        "recyclic-api",
        "python", "src/cli.py", "create-super-admin", "444555666", "Docker Test"
    ]
    
    try:
        print(f"Exécution: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=".")
        
        print(f"Return code: {result.returncode}")
        print(f"STDOUT: {result.stdout}")
        print(f"STDERR: {result.stderr}")
        
        if result.returncode == 0:
            print("✅ CLI exécutée avec succès !")
        else:
            print("❌ Erreur dans l'exécution de la CLI")
            
    except Exception as e:
        print(f"❌ Erreur: {e}")

if __name__ == "__main__":
    test_docker_cli()
