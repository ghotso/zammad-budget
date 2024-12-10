# Zammad Budget Manager

A budget management application for Zammad organizations that tracks and manages time budgets.

## Repository Secrets Setup

Before deploying the Docker container, you need to set up the following secrets in your GitHub repository:

1. Go to your repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Add the following secrets:

Required secrets for GitHub Actions:
- `GITHUB_TOKEN` (automatically provided by GitHub)

Required secrets for the application:
- `ZAMMAD_URL`: Your Zammad instance URL
- `ZAMMAD_TOKEN`: Your Zammad API token
- `APP_PASSWORD`: Password for logging into the budget manager
- `JWT_SECRET`: Secret key for JWT token generation (generate a secure random string)

## Development Setup

1. Clone the repository
2. Copy `.env.example` to `.env` in both frontend and backend directories
3. Fill in the environment variables
4. Install dependencies:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```
5. Start the development servers:
   ```bash
   # Terminal 1
   cd frontend && npm run dev
   
   # Terminal 2
   cd backend && npm run dev
   ```

## Docker Deployment

The application can be deployed using Docker. The container includes both frontend and backend services.

### Environment Variables

When running the container, you need to provide these environment variables:

Required:
- `ZAMMAD_URL`: Your Zammad instance URL
- `ZAMMAD_TOKEN`: Your Zammad API token
- `APP_PASSWORD`: Password for logging into the budget manager
- `JWT_SECRET`: Secret for JWT token generation

Optional (with defaults):
- `NODE_ENV`: Production environment (default: production)
- `DATABASE_URL`: SQLite database path (default: file:./prisma/dev.db)

### Ports

The container exposes:
- Port 80: Frontend web interface
- Port 3000: Backend API

### Volumes

For data persistence:
- `/app/backend/prisma`: SQLite database storage

### Example Docker Run

```bash
docker run -d \
  -p 80:80 \
  -p 3000:3000 \
  -v /path/to/data:/app/backend/prisma \
  -e ZAMMAD_URL=https://your-zammad-instance.com \
  -e ZAMMAD_TOKEN=your_token \
  -e APP_PASSWORD=your_password \
  -e JWT_SECRET=your_secret \
  ghcr.io/yourusername/zammad-budget:latest
```

## License

MIT