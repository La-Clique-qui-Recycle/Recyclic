#!/usr/bin/env python3
import jwt
from datetime import datetime, timedelta

# Clé secrète par défaut
SECRET_KEY = "your-super-secret-key-that-is-long-and-random"

def create_admin_token():
    # ID de l'utilisateur admin créé
    admin_user_id = "a7b2e40f-5d1e-44b8-aefc-8e11e90dee69"
    
    payload = {
        "sub": admin_user_id,
        "exp": datetime.utcnow() + timedelta(hours=1),
        "iat": datetime.utcnow()
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token

if __name__ == "__main__":
    token = create_admin_token()
    print(f"Token: {token}")