#!/bin/bash

# Change to script directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ ! -d "node_modules/canvas" ]; then
  echo "Installing dependencies..."
  npm install
else
  echo "Dependencies already installed."
fi

# Run the generator
echo "Running OpenGraph image generator..."
node generate.js