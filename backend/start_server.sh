#!/bin/bash

# Script to start the Flask backend server with proper configuration
# This ensures the database persists correctly

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Create instance directory if it doesn't exist
mkdir -p instance

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
fi

# Check if required packages are installed
if ! python3 -c "import flask" 2>/dev/null; then
    echo "Installing required packages..."
    pip install -r requirements.txt
fi

# Start the server
echo "Starting Flask server..."
echo "Database location: $SCRIPT_DIR/instance/tasks.db"
python3 app.py

