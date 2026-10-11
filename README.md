# Ommidraai
---

## Linux (Debian based)

### Setup
1. Download the project
```bash
git clone https://github.com/BroerSakki/ommidraai.git
cd ommidraai
```
2. Set up docker and git
```bash
chmod +x ./scripts/setup-docker.sh
./scripts/setup-docker.sh
```
3. Log out, then back in, or reboot

4. Configure map data downloads in osrm/maps.txt (Url's will automatically be downloaded once the application starts)

5. Start the program
```bash
docker compose up -d --build
```
---

## Windows

### Setup

### Requirements

Before installing the application, make sure you have:

* Windows 10 or Windows 11
* Git
* Docker Desktop

### 1. Install Git

Download and install Git for Windows from the official website:

[Git for Windows](https://git-scm.com/download/win)

The default installation options are suitable for this project.

You can verify that Git was installed by opening **PowerShell** and running:

```powershell
git --version
```

### 2. Install Docker Desktop

Download and install Docker Desktop:

[Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

During installation, use the **WSL 2** backend when prompted.

After installation, start Docker Desktop and wait until Docker reports that it is running.

You can verify the installation from PowerShell:

```powershell
docker --version
docker compose version
```

### 3. Download the project

Open **PowerShell** and clone the repository:

```powershell
git clone https://github.com/BroerSakki/ommidraai.git
cd ommidraai
```

### 4. Configure map data downloads in osrm/maps.txt

In osrm/maps.txt add desired map downloads url's from geofabrik (Url's will automatically be downloaded once the application starts)

### 5. Start the application

From the project directory, run:

```powershell
docker compose up -d --build
```

Docker will download the required images, build the application containers, and start the services.

### 5. Access the application

Once the containers have started, open the application in your web browser:

```text
http://localhost:3000
```

### Stopping the application

To stop the application without removing the containers:

```powershell
docker compose stop
```

To stop and remove the containers:

```powershell
docker compose down
```

To start the application again:

```powershell
docker compose up -d
```

