#!/usr/bin/env python3
"""
Tests simplifiés pour le script de déploiement atomique
"""

import pytest
import os
import subprocess
import sys

class TestAtomicDeploySimple:
    """Tests simplifiés pour le script de déploiement atomique"""
    
    def test_script_exists_and_executable(self):
        """Test que le script existe et est exécutable"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'atomic-deploy.sh')
        assert os.path.exists(script_path), "Le script atomic-deploy.sh n'existe pas"
        assert os.access(script_path, os.X_OK), "Le script atomic-deploy.sh n'est pas exécutable"
    
    def test_test_script_exists(self):
        """Test que le script de test existe et est exécutable"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'test-atomic-deploy.sh')
        assert os.path.exists(script_path), "Le script test-atomic-deploy.sh n'existe pas"
        assert os.access(script_path, os.X_OK), "Le script test-atomic-deploy.sh n'est pas exécutable"
    
    def test_script_syntax_valid(self):
        """Test que le script a une syntaxe bash valide"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'atomic-deploy.sh')
        
        # Vérifier la syntaxe bash avec WSL
        result = subprocess.run(
            ['wsl', 'bash', '-n', script_path],
            capture_output=True,
            text=True
        )
        
        assert result.returncode == 0, f"Le script a des erreurs de syntaxe: {result.stderr}"
    
    def test_test_script_syntax_valid(self):
        """Test que le script de test a une syntaxe bash valide"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'test-atomic-deploy.sh')
        
        # Vérifier la syntaxe bash avec WSL
        result = subprocess.run(
            ['wsl', 'bash', '-n', script_path],
            capture_output=True,
            text=True
        )
        
        assert result.returncode == 0, f"Le script de test a des erreurs de syntaxe: {result.stderr}"
    
    def test_script_functions_defined(self):
        """Test que les fonctions principales sont définies dans le script"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'atomic-deploy.sh')
        
        with open(script_path, 'r', encoding='utf-8') as f:
            script_content = f.read()
        
        # Vérifier que les fonctions principales sont définies
        required_functions = [
            'log(',
            'log_success(',
            'log_warning(',
            'log_error(',
            'check_services_health(',
            'wait_for_services(',
            'cleanup_failed_deployment(',
            'atomic_deploy(',
            'show_help('
        ]
        
        for func in required_functions:
            assert func in script_content, f"La fonction {func} n'est pas définie dans le script"
    
    def test_script_has_proper_error_handling(self):
        """Test que le script a une gestion d'erreur appropriée"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'atomic-deploy.sh')
        
        with open(script_path, 'r', encoding='utf-8') as f:
            script_content = f.read()
        
        # Vérifier la présence de set -euo pipefail
        assert 'set -euo pipefail' in script_content, "Le script devrait utiliser 'set -euo pipefail'"
        
        # Vérifier la présence de gestion d'erreur
        assert '|| true' in script_content, "Le script devrait avoir des commandes avec '|| true' pour éviter les échecs"
        assert '|| exit 1' in script_content, "Le script devrait avoir des commandes avec '|| exit 1' pour les erreurs critiques"
    
    def test_script_has_timeout_configuration(self):
        """Test que le script a une configuration de timeout appropriée"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'atomic-deploy.sh')
        
        with open(script_path, 'r', encoding='utf-8') as f:
            script_content = f.read()
        
        # Vérifier la présence de variables de timeout
        assert 'DEPLOY_TIMEOUT' in script_content, "Le script devrait définir DEPLOY_TIMEOUT"
        assert 'HEALTH_CHECK_INTERVAL' in script_content, "Le script devrait définir HEALTH_CHECK_INTERVAL"
        assert 'MAX_RETRIES' in script_content, "Le script devrait calculer MAX_RETRIES"
    
    def test_script_has_cleanup_functionality(self):
        """Test que le script a des fonctionnalités de nettoyage"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'atomic-deploy.sh')
        
        with open(script_path, 'r', encoding='utf-8') as f:
            script_content = f.read()
        
        # Vérifier la présence de nettoyage
        assert 'cleanup_failed_deployment' in script_content, "Le script devrait avoir une fonction de nettoyage"
        assert 'docker rmi' in script_content, "Le script devrait nettoyer les anciennes images"
        assert 'rm -f' in script_content, "Le script devrait nettoyer les fichiers temporaires"
    
    def test_workflow_file_updated(self):
        """Test que le workflow GitHub Actions a été mis à jour"""
        workflow_path = os.path.join(os.path.dirname(__file__), '..', '.github', 'workflows', 'deploy.yaml')
        
        with open(workflow_path, 'r', encoding='utf-8') as f:
            workflow_content = f.read()
        
        # Vérifier que le workflow utilise le script atomique
        assert 'atomic-deploy.sh' in workflow_content, "Le workflow devrait utiliser atomic-deploy.sh"
        assert 'atomic deployment' in workflow_content.lower(), "Le workflow devrait mentionner le déploiement atomique"
        assert 'docker-compose down' not in workflow_content, "Le workflow ne devrait plus utiliser docker-compose down directement"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
