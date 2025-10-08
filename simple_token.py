#!/usr/bin/env python3
import jwt
import uuid
from datetime import datetime, timedelta

# Clé secrète par défaut
SECRET_KEY = "your-super-secret-key-that-is-long-and-random"

def create_token():
    payload = {
        "sub": str(uuid.uuid4()),
        "exp": datetime.utcnow() + timedelta(hours=1),
        "iat": datetime.utcnow()
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token

if __name__ == "__main__":
    token = create_token()
    print(f"Token: {token}")
