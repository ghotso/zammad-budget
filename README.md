# Zammad Budget Manager

A budget management application for Zammad organizations.

## Running with Docker

The application is packaged as a single Docker container that runs both the frontend and backend services.

### Port Mapping

- Frontend: Host port 8071 -> Container port 80
- Backend: Host port 3071 -> Container port 3000

### Data Storage

The application stores data in `/data` inside the container. This directory should be mounted to a persistent volume on the host, typically at `/mnt/user/appdata/zammad-budget`.

### Running the Container

```bash
docker run -d \
  -p 8071:80 \
  -p 3071:3000 \
  -v /mnt/user/appdata/zammad-budget:/data \
  -e ZAMMAD_URL=https://your-zammad-instance.com \
  -e ZAMMAD_TOKEN=your-token \
  -e APP_PASSWORD=your-password \
  -e JWT_SECRET=your-secret \
  ghcr.io/your-username/zammad-budget:latest
```

## Development

For development, you can use the provided Docker Compose configuration:

```bash
docker compose up -d
```

This will start the services with the same port mappings:
- Frontend: http://localhost:8071
- Backend: http://localhost:3071

## Environment Variables

- `ZAMMAD_URL`: Your Zammad instance URL
- `ZAMMAD_TOKEN`: Your Zammad API token
- `APP_PASSWORD`: Password for application login
- `JWT_SECRET`: Secret for JWT token generation
- `DEBUG_LVL`: Debug level (default: debug)

## Data Persistence

The application stores its SQLite database in `/data/dev.db` inside the container. This is mounted from the host's `/mnt/user/appdata/zammad-budget` directory to ensure data persistence.