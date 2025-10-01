#!/bin/sh
# Wrapper script to correctly pass arguments to the Python CLI

# Apply bcrypt compatibility patch before importing modules
python3 -c "
import sys
import bcrypt
if not hasattr(bcrypt, '__about__'):
    class MockAbout:
        __version__ = '4.0.1'
    bcrypt.__about__ = MockAbout()
"

python3 -m recyclic_api.cli create-super-admin --username "$1" --password "$2"
