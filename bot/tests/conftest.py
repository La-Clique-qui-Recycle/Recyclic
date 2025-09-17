"""
Pytest configuration for bot tests.
"""

import sys
import os

# Add the bot source directory to Python path
bot_src_path = os.path.join(os.path.dirname(__file__), '..', 'src')
sys.path.insert(0, bot_src_path)