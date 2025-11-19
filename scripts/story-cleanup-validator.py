#!/usr/bin/env python3
"""
Story Cleanup Validator - Phase 4
Validation et vérification des déplacements
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Tuple

class StoryCleanupValidator:
    def __init__(self, analysis_file: str = "docs/story-analysis-results.json"):
        self.analysis_file = analysis_file
        self.analysis_data = None

    def load_analysis(self) -> bool:
        """Charger les résultats d'analyse"""
        try:
            with open(self.analysis_file, 'r', encoding='utf-8') as f:
                self.analysis_data = json.load(f)
            print(f"✅ Analysis data loaded: {len(self.analysis_data['results'])} files")
            return True
        except Exception as e:
            print(f"❌ Error loading analysis: {e}")
            return False

    def verify_file_integrity(self) -> Tuple[int, int, List[str]]:
        """Vérifier l'intégrité des fichiers déplacés"""
        success_count = 0
        error_count = 0
        errors = []

        for result in self.analysis_data['results']:
            filename = result['filename']
            destination = result['destination']
            expected_path = f"{destination}/{filename}"

            # Vérifier que le fichier existe à sa destination
            if Path(expected_path).exists():
                success_count += 1
            else:
                error_count += 1
                errors.append(f"Missing file: {expected_path}")

        print(f"✅ File integrity: {success_count} OK, {error_count} missing")
        return success_count, error_count, errors

    def verify_symlinks(self) -> Tuple[int, int, List[str]]:
        """Vérifier que les symlinks fonctionnent"""
        success_count = 0
        error_count = 0
        errors = []

        for result in self.analysis_data['results']:
            filename = result['filename']
            destination = result['destination']

            if destination != "docs/stories/":  # seulement les fichiers déplacés
                symlink_path = f"docs/stories/{filename}"
                target_path = f"{destination}/{filename}"

                # Vérifier que le symlink existe
                if not Path(symlink_path).is_symlink():
                    error_count += 1
                    errors.append(f"Missing symlink: {symlink_path}")
                    continue

                # Vérifier que le symlink pointe vers le bon endroit
                try:
                    resolved_path = os.readlink(symlink_path)
                    expected_relative = os.path.relpath(target_path, f"docs/stories")

                    if resolved_path == expected_relative:
                        success_count += 1
                    else:
                        error_count += 1
                        errors.append(f"Wrong symlink target: {symlink_path} → {resolved_path} (expected {expected_relative})")
                except Exception as e:
                    error_count += 1
                    errors.append(f"Error reading symlink {symlink_path}: {e}")

        print(f"✅ Symlinks: {success_count} OK, {error_count} errors")
        return success_count, error_count, errors

    def verify_metadata(self) -> Tuple[int, int, List[str]]:
        """Vérifier que les métadonnées ont été ajoutées"""
        success_count = 0
        error_count = 0
        errors = []

        for result in self.analysis_data['results']:
            filename = result['filename']
            destination = result['destination']

            if destination != "docs/stories/":  # seulement les fichiers déplacés
                file_path = f"{destination}/{filename}"

                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # Vérifier que les métadonnées YAML sont présentes
                    if content.startswith("---") and "cleanup_status:" in content:
                        success_count += 1
                    else:
                        error_count += 1
                        errors.append(f"Missing metadata in: {file_path}")
                except Exception as e:
                    error_count += 1
                    errors.append(f"Error reading metadata from {file_path}: {e}")

        print(f"✅ Metadata: {success_count} OK, {error_count} missing")
        return success_count, error_count, errors

    def test_symlink_access(self) -> Tuple[int, int, List[str]]:
        """Tester l'accès aux fichiers via symlinks"""
        success_count = 0
        error_count = 0
        errors = []

        for result in self.analysis_data['results']:
            filename = result['filename']
            destination = result['destination']

            if destination != "docs/stories/":  # seulement les fichiers déplacés
                symlink_path = f"docs/stories/{filename}"

                try:
                    # Essayer de lire le début du fichier via le symlink
                    with open(symlink_path, 'r', encoding='utf-8') as f:
                        content = f.read(100)  # lire les 100 premiers caractères

                    if len(content) > 0:
                        success_count += 1
                    else:
                        error_count += 1
                        errors.append(f"Empty content via symlink: {symlink_path}")
                except Exception as e:
                    error_count += 1
                    errors.append(f"Error accessing via symlink {symlink_path}: {e}")

        print(f"✅ Symlink access: {success_count} OK, {error_count} errors")
        return success_count, error_count, errors

    def generate_validation_report(self, integrity_results: Tuple, symlink_results: Tuple,
                                 metadata_results: Tuple, access_results: Tuple) -> str:
        """Générer un rapport de validation complet"""
        report = ["# Rapport de Validation - Nettoyage Stories\n"]
        report.append(f"**Date:** {os.popen('date').read().strip()}\n")

        # Résumé général
        total_files = len(self.analysis_data['results'])
        total_moved = sum(1 for r in self.analysis_data['results'] if r['destination'] != "docs/stories/")

        report.append("## Résumé Général\n")
        report.append(f"- **Total fichiers analysés:** {total_files}\n")
        report.append(f"- **Fichiers déplacés:** {total_moved}\n")
        report.append(f"- **Fichiers restés en place:** {total_files - total_moved}\n")

        # Résultats détaillés
        report.append("## Résultats de Validation\n")

        validations = [
            ("Intégrité des fichiers", integrity_results),
            ("Symlinks", symlink_results),
            ("Métadonnées", metadata_results),
            ("Accès via symlinks", access_results)
        ]

        all_passed = True
        for name, (success, errors, details) in validations:
            status = "✅ PASS" if errors == 0 else "❌ FAIL"
            if errors > 0:
                all_passed = False
            report.append(f"### {name}: {status}")
            report.append(f"- Succès: {success}")
            report.append(f"- Erreurs: {errors}")
            if details:
                report.append("- Détails des erreurs:")
                for detail in details[:10]:  # limiter à 10 erreurs max
                    report.append(f"  - {detail}")
                if len(details) > 10:
                    report.append(f"  - ... et {len(details) - 10} autres erreurs")
            report.append("")

        # Conclusion
        report.append("## Conclusion\n")
        if all_passed:
            report.append("🎉 **VALIDATION RÉUSSIE** - Tous les tests sont passés avec succès!\n")
            report.append("Le nettoyage du répertoire stories s'est déroulé parfaitement.\n")
        else:
            report.append("❌ **VALIDATION ÉCHOUÉE** - Des erreurs ont été détectées.\n")
            report.append("Vérifiez les détails ci-dessus et consultez les logs pour diagnostiquer les problèmes.\n")

        # Statistiques finales
        report.append("## Statistiques par Destination\n")
        dest_stats = {}
        for result in self.analysis_data['results']:
            dest = result['destination']
            if dest != "docs/stories/":
                dest_stats[dest] = dest_stats.get(dest, 0) + 1

        for dest, count in sorted(dest_stats.items()):
            report.append(f"- **{dest}:** {count} fichiers")

        return "\n".join(report)

    def execute_validation(self) -> bool:
        """Exécuter toutes les validations"""
        print("🔍 Starting Phase 4: Validation and reporting")

        if not self.load_analysis():
            return False

        # Exécuter toutes les validations
        integrity = self.verify_file_integrity()
        symlinks = self.verify_symlinks()
        metadata = self.verify_metadata()
        access = self.test_symlink_access()

        # Générer le rapport
        report = self.generate_validation_report(integrity, symlinks, metadata, access)

        with open("docs/story-cleanup-validation-report.md", 'w', encoding='utf-8') as f:
            f.write(report)

        print(f"📊 Validation report generated: docs/story-cleanup-validation-report.md")

        # Vérifier si tout est OK
        all_good = all(errors == 0 for _, errors, _ in [integrity, symlinks, metadata, access])

        if all_good:
            print("✅ Phase 4 completed: ALL VALIDATIONS PASSED")
        else:
            print("❌ Phase 4 completed: SOME VALIDATIONS FAILED")

        return all_good

def main():
    validator = StoryCleanupValidator()
    success = validator.execute_validation()

    if success:
        print("🎉 Story cleanup validation: SUCCESS")
    else:
        print("❌ Story cleanup validation: ISSUES DETECTED")

if __name__ == "__main__":
    main()
