#!/bin/bash
# Install all OctoPrint plugins from plugins.txt
# Run as the octoprint user (not root)
# Usage: ./install-plugins.sh

set -e

OCTOPRINT_VENV="${HOME}/oprint"
PLUGIN_LIST="$(dirname "$0")/../plugins.txt"

if [ ! -d "$OCTOPRINT_VENV" ]; then
    echo "ERROR: OctoPrint venv not found at $OCTOPRINT_VENV"
    echo "Make sure OctoPrint is installed first."
    exit 1
fi

echo "=== Installing OctoPrint plugins ==="

while IFS= read -r line; do
    # Skip comments and empty lines
    [[ "$line" =~ ^#.*$ ]] && continue
    [[ -z "$line" ]] && continue

    echo "Installing: $line"
    "$OCTOPRINT_VENV/bin/pip" install "$line"
done < "$PLUGIN_LIST"

echo ""
echo "=== Done! Restart OctoPrint to load plugins ==="
echo "sudo systemctl restart octoprint"
