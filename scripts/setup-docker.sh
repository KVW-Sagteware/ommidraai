#!/usr/bin/env bash

set -e

echo " Setting up Docker"
echo "=="

echo "Updating system..."
echo "---"
sudo apt update
sudo apt upgrade -y
echo "---"
echo

echo "Installing prerequisites..."
echo "---"
sudo apt install -y git curl
echo "---"
echo

echo "Installing Docker..."
echo "---"
curl -fsSL https://get.docker.com | sudo sh
echo "---"
echo

echo "Enabling Docker..."
echo "---"
sudo systemctl enable --now docker
echo "---"
echo

echo "Adding $USER to the docker group..."
echo "---"
sudo usermod -aG docker "$USER"
echo "---"
echo

echo "=="
echo
echo "Docker installation complete!"
echo
echo "Docker version:"
echo "---"
sudo docker --version
echo "---"

echo
echo "Docker Compose version:"
echo "---"
sudo docker compose version
echo "---"

echo
echo "IMPORTANT:"
echo "Please log out and log back in before continuing."
echo
echo "After logging back in, test Docker with:"
echo "    docker run hello-world"
