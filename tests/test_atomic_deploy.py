#!/usr/bin/env python3
"""
Tests unitaires pour le script de déploiement atomique
"""

import pytest
import subprocess
import tempfile
import os
import json
from unittest.mock import patch, MagicMock
import sys

# Ajouter le répertoire scripts au PATH pour les imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))

class TestAtomicDeploy:
    """Tests pour le script de déploiement atomique"""
    
    def test_script_exists_and_executable(self):
        """Test que le script existe et est exécutable"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'atomic-deploy.sh')
        assert os.path.exists(script_path), "Le script atomic-deploy.sh n'existe pas"
        assert os.access(script_path, os.X_OK), "Le script atomic-deploy.sh n'est pas exécutable"
    
    def test_script_help_option(self):
        """Test que le script affiche l'aide correctement"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'atomic-deploy.sh')
        
        # Utiliser WSL pour exécuter le script bash
        result = subprocess.run(
            ['wsl', 'bash', script_path, '--help'],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(__file__)
        )
        
        assert result.returncode == 0, f"Le script devrait retourner 0, mais a retourné {result.returncode}"
        assert "Usage:" in result.stdout, "L'aide devrait contenir 'Usage:'"
        assert "version_tag" in result.stdout, "L'aide devrait mentionner version_tag"
    
    def test_script_without_arguments(self):
        """Test que le script affiche l'aide quand aucun argument n'est fourni"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'atomic-deploy.sh')
        
        # Utiliser WSL pour exécuter le script bash
        result = subprocess.run(
            ['wsl', 'bash', script_path],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(__file__)
        )
        
        assert result.returncode == 0, f"Le script devrait retourner 0, mais a retourné {result.returncode}"
        assert "Usage:" in result.stdout, "L'aide devrait être affichée"
    
    def test_script_requires_jq(self):
        """Test que le script vérifie la présence de jq"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'atomic-deploy.sh')
        
        # Simuler l'absence de jq en modifiant temporairement le PATH
        with patch.dict(os.environ, {'PATH': '/nonexistent'}):
            result = subprocess.run(
                ['wsl', 'bash', script_path, 'test123'],
                capture_output=True,
                text=True,
                cwd=os.path.dirname(__file__)
            )
            
            assert result.returncode != 0, "Le script devrait échouer sans jq"
            assert "jq n'est pas installé" in result.stderr, "Le script devrait mentionner que jq n'est pas installé"
    
    def test_script_checks_compose_file_exists(self):
        """Test que le script vérifie l'existence du fichier docker-compose.yml"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'atomic-deploy.sh')
        
        # Créer un répertoire temporaire sans docker-compose.yml
        with tempfile.TemporaryDirectory() as temp_dir:
            result = subprocess.run(
                [script_path, 'test123'],
                capture_output=True,
                text=True,
                cwd=temp_dir
            )
            
            assert result.returncode != 0, "Le script devrait échouer sans docker-compose.yml"
            assert "docker-compose.yml non trouvé" in result.stderr, "Le script devrait mentionner que docker-compose.yml n'existe pas"
    
    def test_script_checks_env_file_exists(self):
        """Test que le script vérifie l'existence du fichier .env.production"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'atomic-deploy.sh')
        
        # Créer un répertoire temporaire avec docker-compose.yml mais sans .env.production
        with tempfile.TemporaryDirectory() as temp_dir:
            # Créer un docker-compose.yml minimal
            compose_content = """
services:
  api:
    image: test:latest
    ports:
      - "8000:8000"
"""
            with open(os.path.join(temp_dir, 'docker-compose.yml'), 'w') as f:
                f.write(compose_content)
            
            result = subprocess.run(
                [script_path, 'test123'],
                capture_output=True,
                text=True,
                cwd=temp_dir
            )
            
            assert result.returncode != 0, "Le script devrait échouer sans .env.production"
            assert ".env.production non trouvé" in result.stderr, "Le script devrait mentionner que .env.production n'existe pas"
    
    def test_script_syntax_valid(self):
        """Test que le script a une syntaxe bash valide"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'atomic-deploy.sh')
        
        # Vérifier la syntaxe bash
        result = subprocess.run(
            ['bash', '-n', script_path],
            capture_output=True,
            text=True
        )
        
        assert result.returncode == 0, f"Le script a des erreurs de syntaxe: {result.stderr}"
    
    def test_script_functions_defined(self):
        """Test que les fonctions principales sont définies dans le script"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'atomic-deploy.sh')
        
        with open(script_path, 'r') as f:
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
        
        with open(script_path, 'r') as f:
            script_content = f.read()
        
        # Vérifier la présence de set -euo pipefail
        assert 'set -euo pipefail' in script_content, "Le script devrait utiliser 'set -euo pipefail'"
        
        # Vérifier la présence de gestion d'erreur
        assert '|| true' in script_content, "Le script devrait avoir des commandes avec '|| true' pour éviter les échecs"
        assert '|| exit 1' in script_content, "Le script devrait avoir des commandes avec '|| exit 1' pour les erreurs critiques"
    
    def test_script_has_timeout_configuration(self):
        """Test que le script a une configuration de timeout appropriée"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'atomic-deploy.sh')
        
        with open(script_path, 'r') as f:
            script_content = f.read()
        
        # Vérifier la présence de variables de timeout
        assert 'DEPLOY_TIMEOUT' in script_content, "Le script devrait définir DEPLOY_TIMEOUT"
        assert 'HEALTH_CHECK_INTERVAL' in script_content, "Le script devrait définir HEALTH_CHECK_INTERVAL"
        assert 'MAX_RETRIES' in script_content, "Le script devrait calculer MAX_RETRIES"
    
    def test_script_has_cleanup_functionality(self):
        """Test que le script a des fonctionnalités de nettoyage"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'atomic-deploy.sh')
        
        with open(script_path, 'r') as f:
            script_content = f.read()
        
        # Vérifier la présence de nettoyage
        assert 'cleanup_failed_deployment' in script_content, "Le script devrait avoir une fonction de nettoyage"
        assert 'docker rmi' in script_content, "Le script devrait nettoyer les anciennes images"
        assert 'rm -f' in script_content, "Le script devrait nettoyer les fichiers temporaires"


class TestAtomicDeployIntegration:
    """Tests d'intégration pour le script de déploiement atomique"""
    
    def test_test_script_exists(self):
        """Test que le script de test existe et est exécutable"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'test-atomic-deploy.sh')
        assert os.path.exists(script_path), "Le script test-atomic-deploy.sh n'existe pas"
        assert os.access(script_path, os.X_OK), "Le script test-atomic-deploy.sh n'est pas exécutable"
    
    def test_test_script_help_option(self):
        """Test que le script de test affiche l'aide correctement"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'test-atomic-deploy.sh')
        
        result = subprocess.run(
            [script_path, '--help'],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(__file__)
        )
        
        assert result.returncode == 0, f"Le script de test devrait retourner 0, mais a retourné {result.returncode}"
        assert "Usage:" in result.stdout, "L'aide devrait contenir 'Usage:'"
        assert "atomic deployment" in result.stdout.lower(), "L'aide devrait mentionner 'atomic deployment'"
    
    def test_test_script_syntax_valid(self):
        """Test que le script de test a une syntaxe bash valide"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'test-atomic-deploy.sh')
        
        # Vérifier la syntaxe bash
        result = subprocess.run(
            ['bash', '-n', script_path],
            capture_output=True,
            text=True
        )
        
        assert result.returncode == 0, f"Le script de test a des erreurs de syntaxe: {result.stderr}"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
