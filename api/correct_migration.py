#!/usr/bin/env python3
import subprocess
import sys

def run_command(cmd):
    """Exécute une commande et retourne le résultat"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def main():
    print("🔧 Correction de l'état des migrations...")
    
    # 1. Mettre à jour l'état de la base de données
    cmd = 'docker-compose exec -T postgres psql -U recyclic -d recyclic -c "UPDATE alembic_version SET version_num = \'afbbc7f0e804\';"'
    success, stdout, stderr = run_command(cmd)
    
    if success:
        print("✅ État de la base de données mis à jour")
    else:
        print(f"❌ Erreur: {stderr}")
        return False
    
    # 2. Vérifier que la table cash_sessions existe
    cmd = 'docker-compose exec -T postgres psql -U recyclic -d recyclic -c "SELECT table_name FROM information_schema.tables WHERE table_name = \'cash_sessions\';"'
    success, stdout, stderr = run_command(cmd)
    
    if "cash_sessions" in stdout:
        print("✅ Table cash_sessions existe")
    else:
        print("❌ Table cash_sessions n'existe pas")
        return False
    
    # 3. Vérifier l'état des migrations
    cmd = 'docker-compose exec -T postgres psql -U recyclic -d recyclic -c "SELECT version_num FROM alembic_version;"'
    success, stdout, stderr = run_command(cmd)
    
    if success:
        print(f"✅ Version actuelle: {stdout.strip()}")
    
    print("🎉 Correction terminée avec succès!")
    return True

if __name__ == "__main__":
    main()
