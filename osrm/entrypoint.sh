#!/usr/bin/env bash
set -euo pipefail

# =============================================================
# OSRM automated map setup
# Runs whenever the osrm container starts (i.e. on 'docker compose up'):
#   1. Reads the map list from /osrm/maps.txt
#   2. Downloads only the extracts that are NOT already present in /osrm/data
#   3. Merges all extracts into a single merged.osm.pbf
#   4. Builds one routing graph (merged.osrm) with extract/partition/customize
#   5. Starts osrm-routed --algorithm mld on that merged dataset
# =============================================================

DATA_DIR="/osrm/data"
PROCESSED_DIR="/osrm/processed"
MAPS_FILE="/osrm/maps.txt"
PROFILE="/opt/car.lua"
MERGED_PBF="$DATA_DIR/merged.osm.pbf"
CHECKSUM_FILE="$PROCESSED_DIR/.maps-checksum"

mkdir -p "$DATA_DIR" "$PROCESSED_DIR"

echo "======================================================"
echo " OSRM automated map setup"
echo "======================================================"

if [[ ! -f "$MAPS_FILE" ]]; then
    echo "ERROR: $MAPS_FILE not found. Mount osrm/maps.txt into the container." >&2
    exit 1
fi

# --- 1. Read the map list (skip comments and blank lines) ----------------------------
mapfile -t urls < <(grep -vE '^[[:space:]]*(#|$)' "$MAPS_FILE" || true)

if [[ ${#urls[@]} -eq 0 ]]; then
    echo "ERROR: No map URLs found in $MAPS_FILE." >&2
    exit 1
fi

echo "Map list (${#urls[@]} entries):"

extracts=()
for raw_url in "${urls[@]}"; do
    # trim leading/trailing whitespace
    url="$(printf '%s' "$raw_url" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
    [[ -z "$url" ]] && continue

    file_name="$(basename "${url%%\?*}")"

    if [[ ! "$file_name" =~ \.osm\.pbf$ ]]; then
        echo "  WARNING: skipping non-.osm.pbf URL: $url"
        continue
    fi

    extracts+=("$file_name")
    echo "  - $file_name"

    target="$DATA_DIR/$file_name"
    if [[ -f "$target" ]]; then
        echo "      already downloaded; skipping download(reused from osrm/data)"
    else
        echo "      downloading... ( $url )"
        curl -fSL --retry 3 --retry-delay 2 -o "$target" "$url"
        echo "      download complete)"
    fi
done

if [[ ${#extracts[@]} -eq 0 ]]; then
    echo "ERROR: No valid .osm.pbf URLs found in $MAPS_FILE." >&2
    exit 1
fi

# --- 2. Skip rebuild if the merged dataset is still up-to-date ------------------------------
current_checksum="$(md5sum "$MAPS_FILE" | awk '{print $1}')"

if [[ -f "$PROCESSED_DIR/merged.osrm" ]] \
    && [[ -f "$MERGED_PBF" ]] \
    && [[ -f "$CHECKSUM_FILE" ]] \
    && [[ "$(cat "$CHECKSUM_FILE")" == "$current_checksum" ]]; then
    echo "Maps unchanged; merged dataset is up-to-date. Starting osrm-routed..."
    exec osrm-routed --algorithm mld "$PROCESSED_DIR/merged"
fi

# --- 3. Merge all extracts into a single .osm.pbf ---------------------------------------
echo "Merging ${#extracts[@]} extract(s) into $MERGED_PBF ..."

rm -f "$MERGED_PBF"

# Older osmium versions name this command 'merge'; newer ones renamed it to 'cat'.
if osmium --help 2>&1 | grep -qw merge; then
    merge_cmd="merge"
else
    merge_cmd="cat"
fi

osmium "$merge_cmd" "${extracts[@]/#/$DATA_DIR/}" -o "$MERGED_PBF"
echo "Merge complete."

# --- 4. Build the routing graph --------------------------------------------------------------
echo "Removing stale processed files for the merged dataset..."
rm -f "$PROCESSED_DIR/merged.osrm"*

echo "[1/4] osrm-extract"
(cd "$DATA_DIR" && osrm-extract -p "$PROFILE" "$MERGED_PBF")

echo "Moving extracted files to $PROCESSED_DIR"
mv "$DATA_DIR"/merged.osrm* "$PROCESSED_DIR/"

echo "[2/4] osrm-partition"
(cd "$PROCESSED_DIR" && osrm-partition "$PROCESSED_DIR/merged")

echo "[3/4] osrm-customize"
(cd "$PROCESSED_DIR" && osrm-customize "$PROCESSED_DIR/merged")

echo "[4/4] Processing complete"
echo "$current_checksum" > "$CHECKSUM_FILE"

# --- 5. Start the routing server --------------------------------------------------------------
echo "Starting osrm-routed --algorithm mld on merged.osrm ..."
exec osrm-routed --algorithm mld "$PROCESSED_DIR/merged"