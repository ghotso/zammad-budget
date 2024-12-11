# Zammad Budget Manager

A web application to manage and track time budgets for Zammad organizations.

## Development Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and configure environment variables
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

Development servers will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Production Deployment (Unraid)

### Container Information
- Image: `ghcr.io/[your-username]/zammad-budget:latest`
- Container Version: Latest

### Port Mappings
| Host Port | Container Port | Description |
|-----------|---------------|-------------|
| 8071 | 80 | Frontend/UI |
| 3071 | 3000 | Backend API |

### Volume Mapping
| Host Path | Container Path | Description |
|-----------|---------------|-------------|
| /mnt/user/appdata/zammad-budget | /data | Application data |

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| ZAMMAD_URL | Your Zammad instance URL | Yes |
| ZAMMAD_TOKEN | Zammad API token | Yes |
| APP_PASSWORD | Application login password | Yes |
| JWT_SECRET | Secret for JWT tokens | Yes |
| NODE_ENV | Environment setting | Yes |

### Setup Instructions

1. Create the appdata directory:
```bash
mkdir -p /mnt/user/appdata/zammad-budget
```

2. Configure container in Unraid:
   - Add new container
   - Set container name: zammad-budget
   - Set image path: ghcr.io/[your-username]/zammad-budget:latest
   - Configure port mappings:
     - 8071:80
     - 3071:3000
   - Configure volume mapping:
     - /mnt/user/appdata/zammad-budget:/data
   - Set required environment variables

3. Start the container

### Access
- Web UI: `http://[unraid-ip]:8071`
- API: `http://[unraid-ip]:3071`

## Architecture

### Frontend
- React + Vite
- TypeScript
- Tailwind CSS
- Environment-aware API configuration
- JWT-based authentication

### Backend
- Node.js
- Hono framework
- SQLite database
- Prisma ORM
- JWT authentication

### Container
- Alpine Linux base
- Nginx for frontend serving
- Node.js for backend
- SQLite database in mounted volume
- Automatic database migrations
- Environment variable validation

## Development Notes

### Environment Files
- `.env.development` - Development configuration
- `.env.production` - Production configuration
- `.env.example` - Template for configuration

### Database
- Location: `/data/dev.db` in container
- Migrations run automatically on startup
- Prisma schema in `backend/prisma/schema.prisma`

### API Endpoints
- `/api/login` - Authentication
- `/api/organizations` - List organizations
- `/api/organizations/:id` - Organization details
- `/api/organizations/:id/budget-history` - Budget history
- `/api/organizations/:id/monthly-tracking` - Monthly tracking

## Troubleshooting

### Common Issues

1. Login Issues
   - Verify environment variables are set correctly
   - Check browser console for CORS errors
   - Verify cookie settings in nginx configuration

2. Database Issues
   - Check /data directory permissions
   - Verify database file exists and is writable
   - Check Prisma migration logs

3. Network Issues
   - Verify port mappings
   - Check nginx proxy configuration
   - Verify CORS settings

### Logs
- Container logs available in Unraid interface
- Backend logs include detailed request/response information
- Nginx access/error logs included in container logs

## Security Notes
- All sensitive data must be passed via environment variables
- Never commit .env files or credentials
- JWT tokens used for session management
- Cookies set with secure flags
- CORS configured for production environment
- Database stored in protected volume