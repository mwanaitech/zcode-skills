#!/bin/bash
# PEP 668 Workaround Script
# Usage: ./pep668-workaround.sh <package> [--cpu-only]

set -euo pipefail

PACKAGE="$1"
CPU_ONLY="${2:-}"

# Check if pipx is installed
if ! command -v pipx &> /dev/null; then
    echo "pipx not found. Installing pipx..."
    python3 -m pip install --user pipx
    python3 -m pipx ensurepath
fi

# Install the package
if [[ "$CPU_ONLY" == "--cpu-only" ]]; then
    echo "Installing CPU-only version of $PACKAGE..."
    pipx install "$PACKAGE" --index-url "https://download.pytorch.org/whl/cpu"
else
    echo "Installing $PACKAGE with pipx..."
    pipx install "$PACKAGE"
fi

# Verify installation
echo "Verifying installation..."
if pipx list | grep -q "$PACKAGE"; then
    echo "✓ $PACKAGE installed successfully."
else
    echo "✗ Failed to install $PACKAGE." >&2
    exit 1
fi