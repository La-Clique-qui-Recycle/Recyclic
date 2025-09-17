#!/usr/bin/env python3
"""
Test simple pour vérifier que les notifications Telegram fonctionnent
"""

import asyncio
import sys
import os

# Ajouter le répertoire src au path
sys.path.append('src')

from recyclic_api.services.telegram_service import telegram_service

async def test_telegram_notifications():
    """Test des notifications Telegram"""
    print("🧪 Test des notifications Telegram")
    print("=" * 50)
    
    # Test 1: Notification d'approbation
    print("1. Test notification d'approbation...")
    try:
        success = await telegram_service.send_user_approval_notification(
            telegram_id="123456789",  # ID de test
            user_name="Test User",
            message="Message de test d'approbation"
        )
        if success:
            print("✅ Notification d'approbation envoyée avec succès")
        else:
            print("❌ Échec de l'envoi de notification d'approbation")
    except Exception as e:
        print(f"❌ Erreur lors de l'envoi de notification d'approbation: {e}")
    
    print()
    
    # Test 2: Notification de rejet
    print("2. Test notification de rejet...")
    try:
        success = await telegram_service.send_user_rejection_notification(
            telegram_id="123456789",  # ID de test
            user_name="Test User",
            reason="Test de rejet"
        )
        if success:
            print("✅ Notification de rejet envoyée avec succès")
        else:
            print("❌ Échec de l'envoi de notification de rejet")
    except Exception as e:
        print(f"❌ Erreur lors de l'envoi de notification de rejet: {e}")
    
    print()
    
    # Test 3: Notification admin
    print("3. Test notification admin...")
    try:
        success = await telegram_service.notify_admins_user_processed(
            admin_user_id="admin123",
            target_user_name="Test User",
            action="approved"
        )
        if success:
            print("✅ Notification admin envoyée avec succès")
        else:
            print("❌ Échec de l'envoi de notification admin")
    except Exception as e:
        print(f"❌ Erreur lors de l'envoi de notification admin: {e}")
    
    print("\n✅ Tests des notifications Telegram terminés")

if __name__ == "__main__":
    asyncio.run(test_telegram_notifications())
