#!/usr/bin/env python3
"""
Story Cleanup Analyzer - Phase 1
Analyse automatique du répertoire stories pour catégorisation
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Tuple
from dataclasses import dataclass

@dataclass
class StoryAnalysis:
    filename: str
    status: str
    category: str
    destination: str
    indicators: List[str]

class StoryCleanupAnalyzer:
    def __init__(self, stories_dir: str = "docs/stories"):
        self.stories_dir = Path(stories_dir)
        self.analysis_results: List[StoryAnalysis] = []

    def scan_stories(self) -> List[str]:
        """Scanner tous les fichiers .md dans docs/stories/"""
        md_files = []
        for file_path in self.stories_dir.rglob("*.md"):
            if file_path.is_file():
                md_files.append(str(file_path.relative_to(self.stories_dir)))
        return sorted(md_files)

    def analyze_story_status(self, filename: str) -> Tuple[str, List[str]]:
        """Analyser le status d'une story depuis son contenu"""
        filepath = self.stories_dir / filename

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            return "error", [f"read_error: {e}"]

        indicators = []

        # Recherche des indicateurs de status
        if re.search(r'Status:\s*(Terminé|Done|Completed|Finished)', content, re.IGNORECASE):
            indicators.append("status_terminated")
        if re.search(r'Status:\s*(Ready for Review|Review)', content, re.IGNORECASE):
            indicators.append("status_ready_review")
        if re.search(r'Status:\s*(Draft|En cours|In Progress)', content, re.IGNORECASE):
            indicators.append("status_draft")

        # Indicateurs de contenu
        if re.search(r'(Proposition|Future|v\d+\.\d+.*>\s*1\.3)', content, re.IGNORECASE):
            indicators.append("future_version")
        if re.search(r'(tech-debt|dette|stabilization)', content, re.IGNORECASE):
            indicators.append("tech_debt")
        if re.search(r'(Test.*d\'acceptation|Validation|Acceptance)', content, re.IGNORECASE):
            indicators.append("has_validation")

        # Détermination du status
        if "status_terminated" in indicators or ("status_ready_review" in indicators and "has_validation" in indicators):
            status = "terminated"
        elif "future_version" in indicators:
            status = "future"
        elif "tech_debt" in indicators:
            status = "tech_debt"
        elif len(indicators) == 0 or "status_draft" in indicators:
            status = "uncertain"
        else:
            status = "uncertain"

        return status, indicators

    def determine_destination(self, status: str, indicators: List[str]) -> str:
        """Déterminer la destination basée sur le status et les indicateurs"""
        if status == "terminated":
            return "docs/archive/v1.2-and-earlier/"
        elif status == "future":
            return "docs/archive/future-versions/"
        elif status == "tech_debt":
            return "docs/pending-tech-debt/"
        elif status == "uncertain":
            return "docs/stories/to-review/"
        else:
            return "docs/stories/"  # rester en place

    def analyze_all_stories(self) -> List[StoryAnalysis]:
        """Analyser toutes les stories et créer la liste des déplacements"""
        print("🔍 Scanning stories directory...")
        filenames = self.scan_stories()
        print(f"📁 Found {len(filenames)} .md files")

        results = []
        for filename in filenames:
            print(f"📄 Analyzing: {filename}")
            status, indicators = self.analyze_story_status(filename)
            destination = self.determine_destination(status, indicators)

            analysis = StoryAnalysis(
                filename=filename,
                status=status,
                category=self._status_to_category(status),
                destination=destination,
                indicators=indicators
            )
            results.append(analysis)

        self.analysis_results = results
        return results

    def _status_to_category(self, status: str) -> str:
        """Convertir le status interne en catégorie lisible"""
        mapping = {
            "terminated": "Terminée",
            "future": "Future",
            "tech_debt": "Tech Debt",
            "uncertain": "À vérifier"
        }
        return mapping.get(status, "Inconnue")

    def generate_report(self) -> str:
        """Générer un rapport détaillé des actions à effectuer"""
        report = ["# Rapport d'Analyse - Nettoyage Stories\n"]
        report.append(f"**Date:** {os.popen('date').read().strip()}\n")
        report.append(f"**Total fichiers analysés:** {len(self.analysis_results)}\n")

        # Statistiques par catégorie
        categories = {}
        for analysis in self.analysis_results:
            cat = analysis.category
            categories[cat] = categories.get(cat, 0) + 1

        report.append("## Statistiques par catégorie\n")
        for cat, count in categories.items():
            report.append(f"- **{cat}:** {count} fichiers")
        report.append("")

        # Liste détaillée des déplacements
        report.append("## Actions de déplacement proposées\n")

        for analysis in self.analysis_results:
            if analysis.destination != "docs/stories/":  # seulement les fichiers à déplacer
                report.append(f"### {analysis.filename}")
                report.append(f"- **Status:** {analysis.status}")
                report.append(f"- **Catégorie:** {analysis.category}")
                report.append(f"- **Destination:** {analysis.destination}")
                report.append(f"- **Indicateurs:** {', '.join(analysis.indicators) if analysis.indicators else 'Aucun'}")
                report.append("")

        return "\n".join(report)

    def save_analysis_results(self, output_file: str = "docs/story-analysis-results.json"):
        """Sauvegarder les résultats d'analyse pour Phase 2"""
        import json

        results_dict = {
            "timestamp": os.popen('date').read().strip(),
            "total_files": len(self.analysis_results),
            "results": [
                {
                    "filename": r.filename,
                    "status": r.status,
                    "category": r.category,
                    "destination": r.destination,
                    "indicators": r.indicators
                }
                for r in self.analysis_results
            ]
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results_dict, f, indent=2, ensure_ascii=False)

        print(f"💾 Analysis results saved to {output_file}")

def main():
    analyzer = StoryCleanupAnalyzer()
    results = analyzer.analyze_all_stories()

    # Générer le rapport
    report = analyzer.generate_report()
    with open("docs/story-cleanup-analysis-report.md", 'w', encoding='utf-8') as f:
        f.write(report)

    # Sauvegarder les résultats pour Phase 2
    analyzer.save_analysis_results()

    print(f"📊 Report generated: docs/story-cleanup-analysis-report.md")
    print("✅ Phase 1: Analyse automatique terminée")

if __name__ == "__main__":
    main()
