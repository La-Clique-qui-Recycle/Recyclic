#!/bin/bash

# Script de migration des stories et epics Recyclic
# Version: 1.0 - Organisation parfaite des fichiers

set -e  # Arrêter en cas d'erreur

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de log
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
}

# Créer les dossiers de destination
create_directories() {
    log "Création des dossiers de destination..."

    mkdir -p "docs/archive/v1.2-and-earlier"
    mkdir -p "docs/pending-tech-debt"
    mkdir -p "docs/archive/future-versions"
    mkdir -p "docs/archive/obsolete"

    log_success "Dossiers créés"
}

# Fonction pour déplacer un fichier en toute sécurité
safe_move() {
    local src="$1"
    local dest="$2"
    local filename=$(basename "$src")

    if [ -f "$dest/$filename" ]; then
        log_warning "Conflit détecté: $filename existe déjà dans $dest"
        # Créer une sauvegarde du fichier existant
        mv "$dest/$filename" "$dest/$filename.backup.$(date +%Y%m%d_%H%M%S)"
        log_warning "Sauvegarde créée: $dest/$filename.backup.*"
    fi

    mv "$src" "$dest/"
    log_success "Déplacé: $filename → $dest"
}

# Migrer les stories terminées
migrate_completed_stories() {
    log "Migration des stories terminées..."

    local count=0
    while IFS= read -r -d '' file; do
        safe_move "$file" "docs/archive/v1.2-and-earlier"
        ((count++))
    done < <(find docs/stories -name "story-*.md" -exec grep -l "**Statut:** ✅ Terminé et Validé" {} \; -print0)

    log_success "Stories terminées migrées: $count fichiers"
}

# Migrer les dettes techniques en cours
migrate_tech_debt() {
    log "Migration des dettes techniques en cours..."

    local count=0
    while IFS= read -r -d '' file; do
        # Vérifier que ce n'est pas déjà réalisé
        if ! grep -q "Statut.*Done\|Statut.*Terminé\|Statut.*Approuvée" "$file"; then
            safe_move "$file" "docs/pending-tech-debt"
            ((count++))
        fi
    done < <(find docs/stories -name "story-tech-debt-*.md" -print0)

    log_success "Dettes techniques en cours migrées: $count fichiers"
}

# Migrer les propositions futures
migrate_future_proposals() {
    log "Migration des propositions futures..."

    local count=0
    while IFS= read -r -d '' file; do
        safe_move "$file" "docs/archive/future-versions"
        ((count++))
    done < <(find docs/stories -name "story-future-*.md" -print0)

    log_success "Propositions futures migrées: $count fichiers"
}

# Migrer les stories obsolètes
migrate_obsolete_stories() {
    log "Migration des stories obsolètes..."

    local count=0

    # Stories annulées
    while IFS= read -r -d '' file; do
        safe_move "$file" "docs/archive/obsolete"
        ((count++))
    done < <(find docs/stories -name "story-*.md" -exec grep -l "**Statut:** ❌ Annulée" {} \; -print0)

    # Stories anciennes b06-b15
    for prefix in "b06" "b07" "b08" "b09" "b10" "b11" "b12" "b13" "b14" "b15"; do
        while IFS= read -r -d '' file; do
            safe_move "$file" "docs/archive/obsolete"
            ((count++))
        done < <(find docs/stories -name "story-${prefix}*.md" -print0)
    done

    log_success "Stories obsolètes migrées: $count fichiers"
}

# Migrer les epics terminés
migrate_completed_epics() {
    log "Migration des epics terminés..."

    local count=0
    while IFS= read -r -d '' file; do
        safe_move "$file" "docs/archive/v1.2-and-earlier"
        ((count++))
    done < <(find docs/epics -name "epic-*.md" -exec grep -l "**Statut:** Terminé" {} \; -print0)

    log_success "Epics terminés migrés: $count fichiers"
}

# Réorganiser le dossier archive existant
reorganize_existing_archive() {
    log "Réorganisation du dossier archive existant..."

    local moved=0

    # Déplacer les dettes techniques réalisées vers v1.2-and-earlier
    while IFS= read -r -d '' file; do
        if grep -q "Statut.*Done\|Statut.*Terminé\|Statut.*Approuvée" "$file"; then
            safe_move "$file" "docs/archive/v1.2-and-earlier"
            ((moved++))
        fi
    done < <(find docs/stories/archive -name "story-tech-debt-*.md" -print0)

    # Déplacer les autres stories archivées selon leur statut
    while IFS= read -r -d '' file; do
        filename=$(basename "$file")
        if [[ "$filename" =~ story-b[0-9]+.* ]]; then
            # Stories anciennes → obsolete
            safe_move "$file" "docs/archive/obsolete"
            ((moved++))
        elif [[ "$filename" =~ story-.* ]]; then
            # Autres stories → v1.2-and-earlier (déjà archivées)
            safe_move "$file" "docs/archive/v1.2-and-earlier"
            ((moved++))
        fi
    done < <(find docs/stories/archive -name "story-*.md" -print0)

    # Supprimer le dossier archive s'il est vide
    if [ -z "$(ls -A docs/stories/archive/ 2>/dev/null)" ]; then
        rmdir docs/stories/archive/
        log_success "Dossier archive vidé et supprimé"
    fi

    log_success "Fichiers du dossier archive réorganisés: $moved fichiers"
}

# Générer un rapport de validation
generate_report() {
    log "Génération du rapport de validation..."

    cat > docs/migration-report.md << 'EOF'
# 📊 Rapport de Migration - Organisation Stories & Epics Recyclic

Migration effectuée le: $(date)

## 📁 Structure Finale

```
docs/
├── archive/
│   ├── v1.2-and-earlier/     # Stories terminées + Epics terminés + Dettes réalisées
│   ├── future-versions/      # Propositions futures
│   └── obsolete/            # Stories obsolètes et annulées
├── pending-tech-debt/       # Dettes techniques en cours
├── stories/                 # Stories actives
└── epics/                   # Epics actifs
```

## 📈 Statistiques de Migration

### Stories Terminées → archive/v1.2-and-earlier/
EOF

    echo "- $(find docs/archive/v1.2-and-earlier -name "story-*.md" 2>/dev/null | wc -l) stories terminées" >> docs/migration-report.md

    cat >> docs/migration-report.md << 'EOF'

### Dettes Techniques → pending-tech-debt/
EOF

    echo "- $(find docs/pending-tech-debt -name "*.md" 2>/dev/null | wc -l) dettes techniques en cours" >> docs/migration-report.md

    cat >> docs/migration-report.md << 'EOF'

### Propositions Futures → archive/future-versions/
EOF

    echo "- $(find docs/archive/future-versions -name "*.md" 2>/dev/null | wc -l) propositions futures" >> docs/migration-report.md

    cat >> docs/migration-report.md << 'EOF'

### Stories Obsolètes → archive/obsolete/
EOF

    echo "- $(find docs/archive/obsolete -name "*.md" 2>/dev/null | wc -l) stories obsolètes" >> docs/migration-report.md

    cat >> docs/migration-report.md << 'EOF'

### Stories Actives Restantes
EOF

    echo "- $(find docs/stories -name "story-*.md" 2>/dev/null | wc -l) stories actives" >> docs/migration-report.md

    cat >> docs/migration-report.md << 'EOF'

### Epics Actifs Restants
EOF

    echo "- $(find docs/epics -name "epic-*.md" 2>/dev/null | wc -l) epics actifs" >> docs/migration-report.md

    cat >> docs/migration-report.md << 'EOF'

## ✅ Validation

- [ ] Dossiers correctement créés
- [ ] Aucun fichier orphelin
- [ ] Références croisées préservées
- [ ] Structure logique respectée

## 🔍 Vérifications Manuelles Requises

1. Vérifier que les références aux stories migrées dans les epics sont encore valides
2. Contrôler que les liens relatifs dans les fichiers migrés fonctionnent toujours
3. Valider que les outils de recherche trouvent encore les fichiers migrés

---
*Migration automatique effectuée par le script migrate-stories-epics.sh*
EOF

    log_success "Rapport généré: docs/migration-report.md"
}

# Fonction principale
main() {
    log "🚀 Début de la migration parfaite des stories et epics Recyclic"

    create_directories
    migrate_completed_stories
    migrate_tech_debt
    migrate_future_proposals
    migrate_obsolete_stories
    migrate_completed_epics
    reorganize_existing_archive
    generate_report

    log_success "🎉 Migration terminée avec succès !"
    log "📋 Consultez docs/migration-report.md pour le rapport détaillé"
}

# Exécuter si appelé directement
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
