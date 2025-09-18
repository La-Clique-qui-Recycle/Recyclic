#!/bin/sh
# Wrapper script to correctly pass arguments to the Python CLI

python -m recyclic_api.cli create-super-admin --username "$1" --password "$2"
