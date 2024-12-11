# Zammad Budget Manager

A web application to manage and track time budgets for Zammad organizations.

## Features

- Track time budgets per organization
- Monthly budget tracking
- Secure authentication
- Responsive web interface

## Deployment Instructions

### Using GitHub Container Registry (ghcr.io)

The application is available as a Docker container from GitHub Container Registry:

```bash
docker pull ghcr.io/your-username/zammad-budget:latest
```

### Required Ports

- Web Interface: 80 (HTTP)
- Backend API: 3000 (Internal)

### Environment Variables

#### Required Variables

```env
# Security
JWT_SECRET=your-secure-jwt-secret-here      # Required: Secret key for JWT tokens
APP_PASSWORD=your-app-password-here         # Required: Password for application login

# Zammad Integration
ZAMMAD_URL=http://your-zammad-instance      # Required: Your Zammad instance URL
ZAMMAD_TOKEN=your-zammad-token             # Required: Zammad API token
```

#### Optional Variables

```env
# Application Settings
NODE_ENV=production                        # Optional: Environment (default: production)
PORT=3000                                 # Optional: Backend port (default: 3000)

# Database Configuration
DATABASE_URL=file:/data/dev.db            # Optional: SQLite database path (default: /data/dev.db)

# Security Settings
COOKIE_SECURE=true                        # Optional: Use secure cookies (default: true)
COOKIE_SAMESITE=Strict                    # Optional: Cookie SameSite policy (default: Strict)

# Logging
DEBUG_LEVEL=error                         # Optional: Log level (default: error)
ENABLE_REQUEST_LOGGING=false              # Optional: Enable request logging (default: false)

# Resource Limits
MEMORY_LIMIT=512M                         # Optional: Container memory limit
CPU_LIMIT=1.0                            # Optional: Container CPU limit
```

### Unraid Configuration

1. Add a new Docker container in Unraid
2. Use the following settings:

   - Repository: `ghcr.io/your-username/zammad-budget`
   - Network Type: `bridge`
   - Port Mappings:
     - `80:80/tcp` (Web Interface)
   - Environment Variables:
     - Add all required variables listed above
   - Volumes:
     - `/data:/data` (For persistent database storage)

3. Set the following paths in Unraid:
   - Config Path: `/mnt/user/appdata/zammad-budget`
   - Data Path: `/mnt/user/appdata/zammad-budget/data`

### Volume Mounts

The following volumes should be mounted for persistent data:

```yaml
volumes:
  - /path/to/data:/data              # Database and backups
```

### Health Checks

The application includes built-in health checks:

- Web Interface: `http://your-server/health`
- Backend API: `http://your-server/api/health`

### Backup Considerations

The application automatically backs up the SQLite database to `/data/backups`. Ensure this directory is included in your backup strategy.

### Security Notes

1. Always change the default `APP_PASSWORD` and `JWT_SECRET`
2. Use HTTPS in production
3. Set secure cookie options in production
4. Regularly update the container to get security patches

### Troubleshooting

Common issues and solutions:

1. Login not working:
   - Verify `APP_PASSWORD` is set correctly
   - Check `JWT_SECRET` is properly configured
   - Ensure cookies are enabled in your browser

2. Database errors:
   - Check `/data` volume permissions
   - Verify SQLite database exists and is writable

3. Network issues:
   - Verify Zammad instance is accessible
   - Check CORS settings if using custom domain
   - Ensure ports are properly mapped

### Support

For issues and feature requests, please use the GitHub issue tracker.

## Development

### Prerequisites

- Node.js 20 or later
- npm 10 or later

### Local Development

```bash
# Install dependencies
npm install

# Start development servers
npm run dev
```

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview