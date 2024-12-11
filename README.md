# Zammad Budget Manager

Track and manage time budgets for Zammad organizations.

## Features

- Track time budgets for Zammad organizations
- View monthly tracked time
- Add/remove budget entries
- Secure authentication
- Responsive design
- Dark mode support

## Deployment

### Unraid Deployment

1. Add the container from "Apps" or use "Add Container" with the following settings:

```yaml
Repository: ghcr.io/ghotso/zammad-budget:latest
```

#### Port Mappings:
- `8071:80` (Web UI)
- `3071:3000` (Backend API)

#### Volume Mappings:
- `/mnt/user/appdata/zammad-budget:/data`

#### Environment Variables:
```env
NODE_ENV=production
ZAMMAD_URL=https://your-zammad-instance.com
ZAMMAD_TOKEN=your-zammad-token
APP_PASSWORD=your-secure-password
JWT_SECRET=your-secure-jwt-secret
CORS_ALLOWED_ORIGINS=http://your-domain:8071,http://your-domain:3071
```

### Docker Compose Deployment

```yaml
version: '3.8'
services:
  app:
    image: ghcr.io/ghotso/zammad-budget:latest
    ports:
      - "8071:80"    # Frontend web interface
      - "3071:3000"  # Backend API
    environment:
      - NODE_ENV=production
      - ZAMMAD_URL=https://your-zammad-instance.com
      - ZAMMAD_TOKEN=your-zammad-token
      - APP_PASSWORD=your-secure-password
      - JWT_SECRET=your-secure-jwt-secret
      - CORS_ALLOWED_ORIGINS=http://your-domain:8071,http://your-domain:3071
    volumes:
      - /path/to/data:/data:rw
    restart: unless-stopped
```

## Development

### Prerequisites

- Node.js 20 or later
- pnpm
- Docker (optional)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/ghotso/zammad-budget.git
cd zammad-budget
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy and configure environment variables:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Start development servers:
```bash
# Terminal 1: Frontend
cd frontend && pnpm dev

# Terminal 2: Backend
cd backend && pnpm dev
```

### Building

```bash
# Build frontend
cd frontend && pnpm build

# Build backend
cd backend && pnpm build
```

### Docker Build

```bash
docker build -t zammad-budget .
```

## Security

- All communication is encrypted
- JWT-based authentication
- CSRF protection
- Secure HTTP headers
- Regular security updates via GitHub Actions

## License

MIT License

## Support

For issues and feature requests, please use the [GitHub issue tracker](https://github.com/ghotso/zammad-budget/issues).