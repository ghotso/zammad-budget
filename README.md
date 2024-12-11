# Zammad Budget Manager

A web application to manage and track time budgets for Zammad organizations.

## Development Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and configure your environment variables
3. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

4. Start the development servers:
```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory)
npm run dev
```

The development server will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Production Deployment (Unraid)

### Using Docker Container

1. Pull the container from GitHub Container Registry:
```bash
docker pull ghcr.io/[your-username]/zammad-budget:latest
```

2. Configure in Unraid:

- **Container Name**: zammad-budget
- **Repository**: ghcr.io/[your-username]/zammad-budget:latest

### Port Mappings
- Map host port `8071` to container port `80` (Frontend/UI)
- Map host port `3071` to container port `3000` (Backend API)

### Volume Mappings
- Map `/mnt/user/appdata/zammad-budget` to `/data` (Container path)

### Environment Variables
```
ZAMMAD_URL=https://michaelguggenbichler.com
APP_PASSWORD=admin
ZAMMAD_TOKEN=your-token-here
JWT_SECRET=your-secret-here
NODE_ENV=production
```

### Access
- Web UI: `http://your-unraid-ip:8071`
- API: `http://your-unraid-ip:3071`

## Development Notes

### Architecture
- Frontend: React + Vite + TypeScript
- Backend: Node.js + Hono + TypeScript
- Database: SQLite (stored in /data/dev.db)

### API Endpoints
- `/api/login` - Authentication
- `/api/organizations` - List organizations
- `/api/organizations/:id` - Organization details
- `/api/organizations/:id/budget-history` - Budget history
- `/api/organizations/:id/monthly-tracking` - Monthly tracking

### Container Structure
- Nginx serves the frontend on port 80
- Node.js backend runs on port 3000
- All API requests are proxied through Nginx to the backend
- SQLite database is persisted in the /data volume

## Troubleshooting

### Common Issues
1. Database Access
   - Ensure the /data directory is properly mounted
   - Check permissions on dev.db file

2. Login Issues
   - Verify ZAMMAD_URL and ZAMMAD_TOKEN are correct
   - Check browser console for CORS errors
   - Ensure cookies are being set properly

3. Network Issues
   - Confirm port mappings are correct
   - Check Nginx logs for proxy errors
   - Verify backend is accessible

### Logs
- Backend logs: Available through Docker logs
- Nginx access/error logs: Available in Docker logs
- Database: Check /data directory for SQLite file

## Security Notes
- All sensitive data should be passed via environment variables
- JWT_SECRET should be unique and secure
- APP_PASSWORD should be changed from default
- Database is stored in the mounted volume