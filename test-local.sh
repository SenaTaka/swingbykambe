#!/bin/bash
echo "Starting local server..."
echo "Open http://localhost:8000 in your browser"
cd public && python3 -m http.server 8000
