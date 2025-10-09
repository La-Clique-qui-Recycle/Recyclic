#!/usr/bin/env python3
"""
Script de Purge des Données de Test - Projet Recyclic
====================================================

Ce script permet de purger toutes les données de transaction et de test
avant la mise en production, tout en préservant les données de configuration.

Auteur: James (Dev Agent)
Date: 2025-01-27
Version: 1.0

Usage:
    python scripts/reset-production-data.py

Sécurité:
- Demande une confirmation explicite avant suppression
- Ne supprime QUE les données de transaction
- Préserve les utilisateurs, catégories, sites et paramètres
"""

import os
import sys
import getpass
from typing import List, Dict, Any
from datetime import datetime
import logging

# Ajouter le chemin du projet pour les imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api', 'src'))

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/reset-production-data.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ProductionDataReset:
    """Classe pour gérer la purge sécurisée des données de production."""
    
    # Tables de transaction à purger (dans l'ordre de suppression pour respecter les FK)
    TRANSACTION_TABLES = [
        'sale_items',      # Lignes de vente (FK vers sales)
        'sales',          # Ventes (FK vers cash_sessions)
        'ligne_depot',    # Lignes de dépôt (FK vers ticket_depot)
        'ticket_depot',   # Tickets de dépôt (FK vers poste_reception)
        'deposits',       # Dépôts d'objets
        'poste_reception', # Postes de réception
        'cash_sessions',  # Sessions de caisse
    ]
    
    # Tables de configuration à PRÉSERVER
    CONFIG_TABLES = [
        'users',
        'categories', 
        'sites',
        'cash_registers',
        'settings',
        'admin_settings',
        'user_status_history',
        'login_history',
        'email_events',
        'sync_logs'
    ]
    
    def __init__(self):
        """Initialise la connexion à la base de données."""
        self.engine = None
        self.session = None
        self._connect_to_database()
    
    def _connect_to_database(self):
        """Établit la connexion à la base de données via les variables d'environnement."""
        try:
            # Récupération des variables d'environnement
            db_host = os.getenv('POSTGRES_HOST', 'localhost')
            db_port = os.getenv('POSTGRES_PORT', '5432')
            db_name = os.getenv('POSTGRES_DB', 'recyclic')
            db_user = os.getenv('POSTGRES_USER', 'recyclic')
            db_password = os.getenv('POSTGRES_PASSWORD')
            
            if not db_password:
                raise ValueError("POSTGRES_PASSWORD n'est pas définie dans les variables d'environnement")
            
            # Construction de l'URL de connexion
            database_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
            
            # Connexion à la base de données avec paramètres optimisés
            self.engine = create_engine(
                database_url, 
                echo=False,
                pool_pre_ping=True,  # Vérification de la connexion avant utilisation
                pool_recycle=3600   # Recyclage des connexions toutes les heures
            )
            Session = sessionmaker(bind=self.engine)
            self.session = Session()
            
            logger.info(f"Connexion établie à la base de données: {db_host}:{db_port}/{db_name}")
            
        except Exception as e:
            logger.error(f"Erreur de connexion à la base de données: {e}")
            sys.exit(1)
    
    def get_table_counts(self) -> Dict[str, int]:
        """Récupère le nombre d'enregistrements dans chaque table de transaction."""
        counts = {}
        inspector = inspect(self.engine)
        
        for table_name in self.TRANSACTION_TABLES:
            try:
                if inspector.has_table(table_name):
                    result = self.session.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                    counts[table_name] = result.scalar()
                else:
                    counts[table_name] = 0
                    logger.warning(f"Table {table_name} n'existe pas")
            except Exception as e:
                logger.error(f"Erreur lors du comptage de {table_name}: {e}")
                counts[table_name] = -1
        
        return counts
    
    def get_config_table_counts(self) -> Dict[str, int]:
        """Récupère le nombre d'enregistrements dans les tables de configuration."""
        counts = {}
        inspector = inspect(self.engine)
        
        for table_name in self.CONFIG_TABLES:
            try:
                if inspector.has_table(table_name):
                    result = self.session.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                    counts[table_name] = result.scalar()
                else:
                    counts[table_name] = 0
            except Exception as e:
                logger.error(f"Erreur lors du comptage de {table_name}: {e}")
                counts[table_name] = -1
        
        return counts
    
    def display_current_state(self):
        """Affiche l'état actuel de la base de données."""
        print("\n" + "="*60)
        print("📊 ÉTAT ACTUEL DE LA BASE DE DONNÉES")
        print("="*60)
        
        # Tables de transaction
        print("\n📈 DONNÉES DE TRANSACTION (seront supprimées):")
        transaction_counts = self.get_table_counts()
        total_transaction = 0
        
        for table, count in transaction_counts.items():
            if count >= 0:
                print(f"  • {table:<20}: {count:>6} enregistrements")
                total_transaction += count
            else:
                print(f"  • {table:<20}: ERREUR")
        
        print(f"  {'TOTAL':<20}: {total_transaction:>6} enregistrements")
        
        # Tables de configuration
        print("\n⚙️  DONNÉES DE CONFIGURATION (seront préservées):")
        config_counts = self.get_config_table_counts()
        total_config = 0
        
        for table, count in config_counts.items():
            if count >= 0:
                print(f"  • {table:<20}: {count:>6} enregistrements")
                total_config += count
            else:
                print(f"  • {table:<20}: ERREUR")
        
        print(f"  {'TOTAL':<20}: {total_config:>6} enregistrements")
        
        print("\n" + "="*60)
    
    def confirm_deletion(self) -> bool:
        """Demande confirmation explicite à l'utilisateur."""
        print("\n" + "⚠️" * 20 + " ATTENTION " + "⚠️" * 20)
        print("🚨 CETTE OPÉRATION VA SUPPRIMER TOUTES LES DONNÉES DE TRANSACTION 🚨")
        print("⚠️" * 50)
        print()
        print("Les données suivantes seront SUPPRIMÉES :")
        print("  • Toutes les ventes et leurs lignes")
        print("  • Toutes les sessions de caisse")
        print("  • Tous les dépôts d'objets")
        print("  • Tous les tickets et postes de réception")
        print()
        print("Les données suivantes seront PRÉSERVÉES :")
        print("  • Utilisateurs et leurs comptes")
        print("  • Catégories et prix")
        print("  • Sites et caisses")
        print("  • Paramètres système")
        print()
        print("Cette opération est IRRÉVERSIBLE !")
        print()
        
        # Demande de confirmation
        confirmation = input("Tapez 'OUI' (en majuscules) pour confirmer la suppression : ")
        
        if confirmation != "OUI":
            print("❌ Opération annulée par l'utilisateur")
            return False
        
        # Double confirmation
        print("\nDernière chance ! Cette action va supprimer définitivement toutes les données de transaction.")
        final_confirmation = input("Tapez 'CONFIRMER' (en majuscules) pour procéder : ")
        
        if final_confirmation != "CONFIRMER":
            print("❌ Opération annulée par l'utilisateur")
            return False
        
        return True
    
    def reset_transaction_data(self) -> bool:
        """Supprime toutes les données de transaction de manière sécurisée."""
        try:
            logger.info("Début de la purge des données de transaction")
            
            # Désactiver temporairement les contraintes de clés étrangères
            self.session.execute(text("SET session_replication_role = replica;"))
            
            deleted_counts = {}
            
            for table_name in self.TRANSACTION_TABLES:
                try:
                    # Compter avant suppression
                    count_before = self.session.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar()
                    
                    if count_before > 0:
                        # Supprimer toutes les données de la table
                        result = self.session.execute(text(f"DELETE FROM {table_name}"))
                        deleted_counts[table_name] = result.rowcount
                        logger.info(f"Supprimé {result.rowcount} enregistrements de {table_name}")
                    else:
                        deleted_counts[table_name] = 0
                        logger.info(f"Table {table_name} était déjà vide")
                        
                except Exception as e:
                    logger.error(f"Erreur lors de la suppression de {table_name}: {e}")
                    return False
            
            # Réactiver les contraintes de clés étrangères
            self.session.execute(text("SET session_replication_role = DEFAULT;"))
            
            # Commit de la transaction
            self.session.commit()
            
            # Afficher le résumé
            print("\n" + "="*60)
            print("✅ PURGE TERMINÉE AVEC SUCCÈS")
            print("="*60)
            
            total_deleted = 0
            for table, count in deleted_counts.items():
                print(f"  • {table:<20}: {count:>6} enregistrements supprimés")
                total_deleted += count
            
            print(f"  {'TOTAL':<20}: {total_deleted:>6} enregistrements supprimés")
            print("\n🎉 La base de données est maintenant prête pour la production !")
            
            logger.info(f"Purge terminée avec succès. {total_deleted} enregistrements supprimés au total")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de la purge: {e}")
            self.session.rollback()
            return False
    
    def run(self):
        """Exécute le processus complet de purge."""
        try:
            print("🧹 SCRIPT DE PURGE DES DONNÉES DE TEST - RECYCLIC")
            print("=" * 60)
            print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"👤 Utilisateur: {getpass.getuser()}")
            print("=" * 60)
            
            # 1. Afficher l'état actuel
            self.display_current_state()
            
            # 2. Demander confirmation
            if not self.confirm_deletion():
                return False
            
            # 3. Effectuer la purge
            print("\n🔄 Début de la purge...")
            if self.reset_transaction_data():
                print("\n✅ Script terminé avec succès !")
                return True
            else:
                print("\n❌ Erreur lors de la purge !")
                return False
                
        except KeyboardInterrupt:
            print("\n\n❌ Opération interrompue par l'utilisateur")
            return False
        except Exception as e:
            logger.error(f"Erreur inattendue: {e}")
            print(f"\n❌ Erreur inattendue: {e}")
            return False
        finally:
            if self.session:
                self.session.close()
            if self.engine:
                self.engine.dispose()

def main():
    """Point d'entrée principal du script."""
    # Vérifier que nous sommes dans le bon répertoire
    if not os.path.exists('api/src/recyclic_api'):
        print("❌ Erreur: Ce script doit être exécuté depuis la racine du projet Recyclic")
        sys.exit(1)
    
    # Créer le répertoire de logs si nécessaire
    os.makedirs('logs', exist_ok=True)
    
    # Exécuter le script
    reset_script = ProductionDataReset()
    success = reset_script.run()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
