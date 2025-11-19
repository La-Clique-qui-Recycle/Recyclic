#!/usr/bin/env python3
import requests

# Test d'une vente à zéro euro avec preset
url = "http://localhost:8000/v1/sales/"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwic2NvcGVzIjpbInVzZXI6cmVhZCIsInVzZXI6d3JpdGUiXSwiaWF0IjoxNjM4MzY4MDAwLCJleHAiOjE2MzgzNzE2MDB9.test"
}

data = {
    "cash_session_id": "9ba7c477-cc98-4194-9304-5f3b76750726",
    "items": [{
        "category": "test",
        "quantity": 1,
        "weight": 1.0,
        "unit_price": 0.0,
        "total_price": 0.0
    }],
    "total_amount": 0.0,
    "preset_id": "test-preset-id",
    "notes": "Test zero euro transaction"
}

print("Testing zero euro sale with preset...")
response = requests.post(url, json=data, headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
