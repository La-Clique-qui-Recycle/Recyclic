#!/usr/bin/env python3
import json
import requests

# Test login avec les bonnes données
login_data = {'username': 'admintest1', 'password': 'Test1234!'}
response = requests.post('http://localhost:8000/v1/auth/login', json=login_data)

print('Status code:', response.status_code)
print('Response:', response.text)

if response.status_code == 200:
    token = response.json().get('access_token')
    print('Token obtenu:', token[:50] + '...')

    # Test l'endpoint des caisses avec le token
    headers = {'Authorization': f'Bearer {token}'}
    cash_response = requests.get('http://localhost:8000/v1/cash-registers/status', headers=headers)
    print('Cash registers status:', cash_response.status_code)
    print('Cash registers data:', cash_response.text)
else:
    print('Login failed!')
