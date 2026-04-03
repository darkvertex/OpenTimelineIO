#!/usr/bin/env bash

set -euo pipefail

git submodule update --init --recursive
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r docs/requirements.txt
python -m pip install -e ".[dev]"
npm ci --prefix src/wasm-opentimelineio
