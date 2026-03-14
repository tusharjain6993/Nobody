#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
: "${RELEASE_SHA:?RELEASE_SHA is required}"

RELEASE_DIR="${DEPLOY_PATH}/releases/${RELEASE_SHA}"
CURRENT_LINK="${DEPLOY_PATH}/current"
INDEX_FILE="${RELEASE_DIR}/index.html"

mkdir -p "${DEPLOY_PATH}/releases"

if [ ! -d "${RELEASE_DIR}" ]; then
  echo "Release directory not found: ${RELEASE_DIR}"
  exit 1
fi

if [ ! -f "${INDEX_FILE}" ]; then
  echo "Release is missing index.html: ${INDEX_FILE}"
  exit 1
fi

ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}"

if command -v nginx >/dev/null 2>&1; then
  sudo nginx -t
  sudo systemctl reload nginx
fi

find "${DEPLOY_PATH}/releases" -mindepth 1 -maxdepth 1 -type d ! -samefile "${RELEASE_DIR}" -printf '%T@ %p\n' \
  | sort -n \
  | head -n -4 \
  | cut -d' ' -f2- \
  | xargs -r rm -rf

echo "Frontend deployed to ${CURRENT_LINK}"
