#!/usr/bin/env python3
"""
Story Cleanup Mover - Phase 3
Déplacement sécurisé des fichiers vers leurs destinations
"""

import os
import json
import shutil
from pathlib import Path
from datetime import datetime

class StoryCleanupMover:
    def __init__(self, analysis_file: str = "docs/story-analysis-results.json"):
        self.analysis_file = analysis_file
        self.backup_dir = Path("docs/backup-pre-cleanup")
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

    def create_backup(self) -> bool:
        """Créer un backup complet du répertoire stories avant déplacement"""
        try:
            if self.backup_dir.exists():
                print(f"⚠️  Backup directory already exists: {self.backup_dir}")
                return True

            print(f"📦 Creating backup: {self.backup_dir}")
            shutil.copytree("docs/stories", self.backup_dir)
            print(f"✅ Backup created successfully")
            return True
        except Exception as e:
            print(f"❌ Error creating backup: {e}")
            return False

    def create_directories(self) -> bool:
        """Créer les répertoires de destination nécessaires"""
        directories = [
            "docs/archive/v1.2-and-earlier",
            "docs/archive/future-versions",
            "docs/pending-tech-debt",
            "docs/stories/to-review"
        ]

        try:
            for dir_path in directories:
                Path(dir_path).mkdir(parents=True, exist_ok=True)
                print(f"📁 Created/verified directory: {dir_path}")
            return True
        except Exception as e:
            print(f"❌ Error creating directories: {e}")
            return False

    def move_file_safely(self, src: str, dest: str, filename: str) -> bool:
        """Déplacer un fichier de manière sécurisée"""
        src_path = Path(src)
        dest_path = Path(dest) / filename

        try:
            # Vérifier que le fichier source existe
            if not src_path.exists():
                print(f"⚠️  Source file not found: {src_path}")
                return False

            # Créer le répertoire de destination si nécessaire
            dest_path.parent.mkdir(parents=True, exist_ok=True)

            # Déplacer le fichier
            shutil.move(str(src_path), str(dest_path))
            print(f"✅ Moved: {src} → {dest}/{filename}")
            return True
        except Exception as e:
            print(f"❌ Error moving {src} → {dest}: {e}")
            return False

    def create_symlink(self, target: str, link: str) -> bool:
        """Créer un symlink relatif pour compatibilité"""
        try:
            # Calculer le chemin relatif depuis docs/stories vers la destination
            link_path = Path(link)
            target_path = Path(target)

            # Créer un chemin relatif depuis le répertoire du lien vers la cible
            relative_path = os.path.relpath(str(target_path), str(link_path.parent))

            # Supprimer le lien s'il existe déjà
            if link_path.exists() or link_path.is_symlink():
                link_path.unlink()

            # Créer le symlink
            link_path.parent.mkdir(parents=True, exist_ok=True)
            os.symlink(relative_path, str(link_path))
            print(f"🔗 Created symlink: {link} → {relative_path}")
            return True
        except Exception as e:
            print(f"❌ Error creating symlink {link} → {target}: {e}")
            return False

    def add_metadata_to_file(self, filepath: str, metadata: dict) -> bool:
        """Ajouter les métadonnées YAML au fichier"""
        try:
            file_path = Path(filepath)
            if not file_path.exists():
                print(f"⚠️  File not found for metadata: {filepath}")
                return False

            # Lire le contenu actuel
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Créer les métadonnées YAML
            yaml_metadata = "---\n"
            for key, value in metadata.items():
                yaml_metadata += f"{key}: {value}\n"
            yaml_metadata += "---\n\n"

            # Ajouter les métadonnées au début si elles n'existent pas déjà
            if not content.startswith("---"):
                new_content = yaml_metadata + content
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"📝 Added metadata to: {filepath}")
            else:
                print(f"ℹ️  Metadata already present in: {filepath}")

            return True
        except Exception as e:
            print(f"❌ Error adding metadata to {filepath}: {e}")
            return False

    def process_file_movements(self) -> tuple[int, int]:
        """Traiter tous les déplacements de fichiers"""
        moved_count = 0
        error_count = 0

        for result in self.analysis_data['results']:
            filename = result['filename']
            destination = result['destination']
            status = result['status']

            # Ne déplacer que les fichiers qui ont une destination différente
            if destination != "docs/stories/":
                src_path = f"docs/stories/{filename}"

                # Déplacer le fichier
                if self.move_file_safely(src_path, destination, filename):
                    moved_count += 1

                    # Créer un symlink pour compatibilité
                    link_path = f"docs/stories/{filename}"
                    target_path = f"{destination}/{filename}"
                    self.create_symlink(target_path, link_path)

                    # Ajouter les métadonnées
                    metadata = {
                        "cleanup_status": status,
                        "cleanup_destination": destination,
                        "cleanup_date": datetime.now().isoformat(),
                        "original_path": f"docs/stories/{filename}"
                    }
                    self.add_metadata_to_file(target_path, metadata)
                else:
                    error_count += 1

        return moved_count, error_count

    def generate_movement_report(self, moved_count: int, error_count: int) -> str:
        """Générer un rapport détaillé des déplacements"""
        report = ["# Rapport de Déplacement - Nettoyage Stories\n"]
        report.append(f"**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        report.append(f"**Backup créé:** {self.backup_dir}\n")
        report.append(f"**Fichiers déplacés:** {moved_count}\n")
        report.append(f"**Erreurs:** {error_count}\n")

        # Statistiques par destination
        dest_stats = {}
        for result in self.analysis_data['results']:
            dest = result['destination']
            if dest != "docs/stories/":
                dest_stats[dest] = dest_stats.get(dest, 0) + 1

        report.append("## Statistiques par destination\n")
        for dest, count in dest_stats.items():
            report.append(f"- **{dest}:** {count} fichiers")
        report.append("")

        # Liste détaillée des déplacements
        report.append("## Déplacements effectués\n")
        for result in self.analysis_data['results']:
            dest = result['destination']
            if dest != "docs/stories/":
                report.append(f"- `{result['filename']}` → `{dest}/`")
        report.append("")

        # Liste des symlinks créés
        report.append("## Symlinks de compatibilité\n")
        for result in self.analysis_data['results']:
            dest = result['destination']
            if dest != "docs/stories/":
                report.append(f"- `docs/stories/{result['filename']}` → `{dest}/{result['filename']}`")
        report.append("")

        if error_count > 0:
            report.append("## ⚠️ Erreurs rencontrées\n")
            report.append(f"{error_count} fichiers n'ont pas pu être déplacés.\n")

        return "\n".join(report)

    def execute_cleanup(self) -> bool:
        """Exécuter le nettoyage complet"""
        print("🚀 Starting Phase 3: Secure file movement")

        # Étape 1: Charger l'analyse
        if not self.load_analysis():
            return False

        # Étape 2: Créer le backup
        if not self.create_backup():
            return False

        # Étape 3: Créer les répertoires
        if not self.create_directories():
            return False

        # Étape 4: Traiter les déplacements
        moved_count, error_count = self.process_file_movements()

        # Étape 5: Générer le rapport
        report = self.generate_movement_report(moved_count, error_count)
        with open("docs/story-cleanup-movement-report.md", 'w', encoding='utf-8') as f:
            f.write(report)

        print(f"📊 Movement report generated: docs/story-cleanup-movement-report.md")
        print(f"✅ Phase 3 completed: {moved_count} files moved, {error_count} errors")

        return error_count == 0

def main():
    mover = StoryCleanupMover()
    success = mover.execute_cleanup()

    if success:
        print("🎉 Story cleanup Phase 3: SUCCESS")
    else:
        print("❌ Story cleanup Phase 3: ERRORS OCCURRED")

if __name__ == "__main__":
    main()
