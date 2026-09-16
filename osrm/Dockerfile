# Custom OSRM backend image that automates map setup on container start:
#   - curl: downloads the .osm.pbf extracts listed in /osrm/maps.txt
#   - osmium-tool: merges all extracts into a single .osm.pbf so the
#     routing graph can be built once for the whole merged area.
FROM osrm/osrm-backend:latest

# NOTE: the 'latest' image is based on Debian Stretch (EOL). Its package
# repos have moved to archive.debian.org and stretch-updates is gone, so we
# rewrite the sources and allow the archived (expired) Release files before
# installing curl (downloader) and osmium-tool (merger).
RUN sed -i \
        -e 's|deb\.debian\.org|archive.debian.org|g' \
        -e 's|security\.debian\.org|archive.debian.org|g' \
        -e '/stretch-updates/d' \
        /etc/apt/sources.list \
    && find /etc/apt/sources.list.d -name '*.list' \
        -exec sed -i \
            -e 's|deb\.debian\.org|archive.debian.org|g' \
            -e 's|security\.debian\.org|archive.debian.org|g' \
            -e '/stretch-updates/d' {} \; 2>/dev/null || true \
    && apt-get -o Acquire::Check-Valid-Until=false update \
    && apt-get -o Acquire::Check-Valid-Until=false install -y --no-install-recommends \
        ca-certificates \
        curl \
        osmium-tool \
    && rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /usr/local/bin/osrm-entrypoint.sh
RUN chmod +x /usr/local/bin/osrm-entrypoint.sh

WORKDIR /osrm
