#!/bin/bash
# Script pour obtenir la version depuis package.json
node -p "require('./frontend/package.json').version"
