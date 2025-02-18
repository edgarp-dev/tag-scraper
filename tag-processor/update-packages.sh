#!/bin/bash

if ! command -v ncu &> /dev/null; then
    echo "npm-check-updates is not installed. Installing..."
    npm install -g npm-check-updates
else
    echo "npm-check-updates is already installed."
fi

echo "Checking for package updates..."
ncu_output=$(ncu)

if echo "$ncu_output" | grep -q "upgrade"; then
    echo "Updates found. Updating packages..."
    ncu -u && npm install
    echo "Packages updated successfully."
else
     echo "All packages are up to date."
fi
