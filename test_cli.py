#!/usr/bin/env python3
"""Test script for CLI"""
import subprocess
import sys

def test_cli():
    try:
        # Test CLI command
        result = subprocess.run([
            "wsl", "bash", "-c", 
            "cd /mnt/d/Users/Strophe/Documents/°IA/La\\ Clique\\ Qui\\ Recycle/Recyclic/api && "
            "source ~/miniconda3/etc/profile.d/conda.sh && "
            "conda activate base && "
            "python create_schema.py"
        ], capture_output=True, text=True, timeout=30)
        
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        print("Return code:", result.returncode)
        
    except subprocess.TimeoutExpired:
        print("Command timed out")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_cli()
