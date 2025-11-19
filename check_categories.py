#!/usr/bin/env python3
import asyncio
import sys
import os

# Add the api directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))

from sqlalchemy import text
from app.core.database import get_db

async def check_categories():
    try:
        async for db in get_db():
            result = await db.execute(text('SELECT id, name, shortcut_key FROM categories WHERE is_active = true ORDER BY name'))
            categories = result.fetchall()
            print('Categories with shortcuts:')
            for cat in categories:
                shortcut = cat.shortcut_key or 'None'
                print(f'  {cat.id}: {cat.name} -> {shortcut}')
            break
    except Exception as e:
        print(f'Error: {e}')

if __name__ == '__main__':
    asyncio.run(check_categories())
