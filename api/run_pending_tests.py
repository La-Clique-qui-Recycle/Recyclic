#!/usr/bin/env python3
"""
Script de test complet pour la story 3.3 - Validation des inscriptions
Exécute tous les tests et génère un rapport de couverture
"""

import subprocess
import sys
import os
import json
from datetime import datetime
from pathlib import Path

def run_command(command, description):
    """Exécute une commande et retourne le résultat"""
    print(f"\n🔧 {description}")
    print(f"Commande: {command}")
    print("-" * 50)
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )
        
        if result.returncode == 0:
            print(f"✅ {description} - SUCCÈS")
            if result.stdout:
                print("Sortie:")
                print(result.stdout)
        else:
            print(f"❌ {description} - ÉCHEC")
            print(f"Code de retour: {result.returncode}")
            if result.stderr:
                print("Erreurs:")
                print(result.stderr)
            if result.stdout:
                print("Sortie:")
                print(result.stdout)
        
        return result.returncode == 0, result.stdout, result.stderr
        
    except subprocess.TimeoutExpired:
        print(f"⏰ {description} - TIMEOUT (5 minutes)")
        return False, "", "Timeout"
    except Exception as e:
        print(f"💥 {description} - ERREUR: {e}")
        return False, "", str(e)

def check_dependencies():
    """Vérifie que les dépendances sont installées"""
    print("🔍 Vérification des dépendances...")
    
    dependencies = [
        ("pytest", "pytest --version"),
        ("pytest-cov", "pytest-cov --version"),
        ("requests", "python -c 'import requests; print(requests.__version__)'"),
    ]
    
    all_ok = True
    for name, command in dependencies:
        success, stdout, stderr = run_command(command, f"Vérification de {name}")
        if not success:
            print(f"❌ {name} non installé ou non fonctionnel")
            all_ok = False
        else:
            print(f"✅ {name} installé")
    
    return all_ok

def run_unit_tests():
    """Exécute les tests unitaires"""
    print("\n🧪 Exécution des tests unitaires...")
    
    # Test des endpoints admin
    success, stdout, stderr = run_command(
        "python -m pytest api/tests/test_admin_pending_endpoints.py -v --tb=short",
        "Tests unitaires des endpoints admin"
    )
    
    return success, stdout, stderr

def run_integration_tests():
    """Exécute les tests d'intégration"""
    print("\n🔗 Exécution des tests d'intégration...")
    
    success, stdout, stderr = run_command(
        "python -m pytest api/tests/test_integration_pending_workflow.py -v --tb=short",
        "Tests d'intégration du workflow"
    )
    
    return success, stdout, stderr

def run_e2e_tests():
    """Exécute les tests end-to-end"""
    print("\n🌐 Exécution des tests end-to-end...")
    
    success, stdout, stderr = run_command(
        "python -m pytest api/tests/test_e2e_pending_validation.py -v --tb=short",
        "Tests end-to-end"
    )
    
    return success, stdout, stderr

def run_coverage_analysis():
    """Exécute l'analyse de couverture"""
    print("\n📊 Analyse de couverture de code...")
    
    success, stdout, stderr = run_command(
        "python -m pytest api/tests/test_admin_pending_endpoints.py api/tests/test_integration_pending_workflow.py --cov=recyclic_api --cov-report=html --cov-report=term-missing",
        "Analyse de couverture"
    )
    
    return success, stdout, stderr

def run_frontend_tests():
    """Exécute les tests frontend"""
    print("\n🎨 Exécution des tests frontend...")
    
    # Changer vers le répertoire frontend
    frontend_dir = Path(__file__).parent.parent / "frontend"
    if not frontend_dir.exists():
        print("❌ Répertoire frontend non trouvé")
        return False, "", "Répertoire frontend non trouvé"
    
    # Exécuter les tests frontend
    success, stdout, stderr = run_command(
        f"cd {frontend_dir} && npm test -- --run",
        "Tests frontend"
    )
    
    return success, stdout, stderr

def generate_test_report(results):
    """Génère un rapport de test"""
    print("\n📋 Génération du rapport de test...")
    
    report = {
        "timestamp": datetime.now().isoformat(),
        "story": "3.3 - API et Interface pour la Validation des Inscriptions",
        "tests": results,
        "summary": {
            "total_tests": len(results),
            "passed": sum(1 for r in results if r["success"]),
            "failed": sum(1 for r in results if not r["success"])
        }
    }
    
    # Sauvegarder le rapport
    report_file = Path(__file__).parent / "test_report_3_3.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"📄 Rapport sauvegardé dans: {report_file}")
    
    # Afficher le résumé
    print("\n" + "="*60)
    print("📊 RÉSUMÉ DES TESTS")
    print("="*60)
    print(f"Total des tests: {report['summary']['total_tests']}")
    print(f"✅ Réussis: {report['summary']['passed']}")
    print(f"❌ Échoués: {report['summary']['failed']}")
    
    if report['summary']['failed'] == 0:
        print("\n🎉 TOUS LES TESTS SONT PASSÉS !")
        print("La story 3.3 est prête pour la validation.")
    else:
        print(f"\n⚠️ {report['summary']['failed']} test(s) ont échoué.")
        print("Vérifiez les logs ci-dessus pour plus de détails.")
    
    return report

def main():
    """Fonction principale"""
    print("🚀 Script de test complet pour la Story 3.3")
    print("=" * 60)
    print("API et Interface pour la Validation des Inscriptions")
    print("=" * 60)
    
    results = []
    
    # 1. Vérification des dépendances
    deps_ok = check_dependencies()
    results.append({
        "name": "Vérification des dépendances",
        "success": deps_ok,
        "output": "Dépendances vérifiées" if deps_ok else "Erreur de dépendances"
    })
    
    if not deps_ok:
        print("\n❌ Arrêt des tests - Dépendances manquantes")
        return 1
    
    # 2. Tests unitaires backend
    success, stdout, stderr = run_unit_tests()
    results.append({
        "name": "Tests unitaires backend",
        "success": success,
        "output": stdout,
        "error": stderr
    })
    
    # 3. Tests d'intégration
    success, stdout, stderr = run_integration_tests()
    results.append({
        "name": "Tests d'intégration",
        "success": success,
        "output": stdout,
        "error": stderr
    })
    
    # 4. Tests end-to-end
    success, stdout, stderr = run_e2e_tests()
    results.append({
        "name": "Tests end-to-end",
        "success": success,
        "output": stdout,
        "error": stderr
    })
    
    # 5. Tests frontend
    success, stdout, stderr = run_frontend_tests()
    results.append({
        "name": "Tests frontend",
        "success": success,
        "output": stdout,
        "error": stderr
    })
    
    # 6. Analyse de couverture
    success, stdout, stderr = run_coverage_analysis()
    results.append({
        "name": "Analyse de couverture",
        "success": success,
        "output": stdout,
        "error": stderr
    })
    
    # 7. Génération du rapport
    report = generate_test_report(results)
    
    # Code de retour
    if report['summary']['failed'] == 0:
        return 0
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main())
