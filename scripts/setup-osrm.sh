#!/usr/bin/env bash
set -euo pipefail

# For manual downloading only

# Print usage instructions
usage() {
  echo "Usage: $0 [options] <openstreetmap-extract-url>" >&2
  echo "Options:" >&2
  echo "  --no-download    Skip downloading and use the existing file in the data directory" >&2
  echo "Example: $0 --no-download https://download.geofabrik.de/europe/germany/berlin-latest.osm.pbf" >&2
  exit 1
}

# Parse options
NO_DOWNLOAD=false
URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-download)
      NO_DOWNLOAD=true
      shift
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage
      ;;
    *)
      if [[ -n "$URL" ]]; then
        echo "Error: Multiple URLs provided." >&2
        usage
      fi
      URL="$1"
      shift
      ;;
  esac
done

# Ensure URL is provided
if [[ -z "$URL" ]]; then
  echo "Error: Missing openstreetmap-extract-url." >&2
  usage
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DATA_DIR="$PROJECT_ROOT/osrm/data"
PROCESSED_DIR="$PROJECT_ROOT/osrm/processed"

command -v docker >/dev/null 2>&1 || {
  echo "Docker is required but was not found in PATH." >&2
  exit 1
}

mkdir -p "$DATA_DIR" "$PROCESSED_DIR"

FILE_NAME="$(basename "${URL%%\?*}")"
TARGET_FILE="$DATA_DIR/$FILE_NAME"

if [[ ! "$FILE_NAME" =~ \.osm\.pbf$ ]]; then
  echo "The input URL must point to an .osm.pbf extract." >&2
  exit 1
fi

# Handle download logic
if [[ "$NO_DOWNLOAD" == true ]]; then
  if [[ ! -f "$TARGET_FILE" ]]; then
    echo "Error: File '$TARGET_FILE' not found. Cannot skip download." >&2
    exit 1
  fi
  echo "Skipping download as requested. Using existing file: $TARGET_FILE"
else
  if [[ -f "$TARGET_FILE" ]]; then
    echo "Removing existing download: $TARGET_FILE"
    rm -f "$TARGET_FILE"
  fi
  echo "Downloading extract into $DATA_DIR"
  curl -fsSL "$URL" -o "$TARGET_FILE"
  echo "Step A: download complete"
fi

MAP_STEM="${FILE_NAME%.osm.pbf}"
EXTRACTED_OSRM="$PROCESSED_DIR/$MAP_STEM.osrm"

if [[ -f "$EXTRACTED_OSRM" ]]; then
  echo "Removing existing processed files for $MAP_STEM"
  rm -f "$PROCESSED_DIR/$MAP_STEM".*
fi

echo "Step B: extracting routing graph with osrm-extract"
docker run --rm \
  -v "$DATA_DIR:/data" \
  -v "$PROCESSED_DIR:/processed" \
  osrm/osrm-backend:latest \
  sh -c "cd /data && osrm-extract -p /opt/car.lua /data/$FILE_NAME"

for source_file in "$DATA_DIR/$MAP_STEM.osrm"*; do
  if [[ -e "$source_file" ]]; then
    mv "$source_file" "$PROCESSED_DIR/"
  fi
done

echo "Step C: partitioning graph with osrm-partition"
docker run --rm \
  -v "$PROCESSED_DIR:/processed" \
  osrm/osrm-backend:latest \
  sh -c "cd /processed && osrm-partition /processed/$MAP_STEM"

echo "Step D: customizing graph for MLD with osrm-customize"
docker run --rm \
  -v "$PROCESSED_DIR:/processed" \
  osrm/osrm-backend:latest \
  sh -c "cd /processed && osrm-customize /processed/$MAP_STEM"

echo "OSRM processing completed successfully."
echo "Processed files are available in $PROCESSED_DIR"
