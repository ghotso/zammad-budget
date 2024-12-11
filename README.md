# Zammad Budget Manager

A web application to manage budgets for organizations in Zammad. Track and manage time budgets efficiently with a modern web interface.

## Features

- Track time budgets for Zammad organizations
- View monthly tracked time statistics
- Add and remove budget entries
- Secure authentication system
- Modern, responsive UI
- SQLite database for easy deployment
- Docker support for easy installation

## Prerequisites

- Node.js 20 or higher
- Docker (for containerized deployment)
- A Zammad instance with API access

## Quick Start with Docker

1. Pull the latest image:
```bash
docker pull ghcr.io/yourusername/zammad-budget:latest
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Edit the `.env` file with your configuration:
```env
ZAMMAD_URL=https://your-zammad-instance.com
ZAMMAD_TOKEN=your-zammad-token
APP_PASSWORD=your-secure-password
JWT_SECRET=your-secure-jwt-secret
```

4. Run the container:
```bash
docker-compose up -d
```

5. Access the application at http://localhost:8071

## Unraid Installation

1. Add the following template repository to your Unraid server:
   - https://github.com/yourusername/zammad-budget/tree/main/templates

2. In the Unraid Docker tab, click "Add Container" and search for "Zammad Budget Manager"

3. Configure the following:
   - Host Port: 8071 (frontend)
   - Host Port: 3071 (backend API)
   - ZAMMAD_URL: Your Zammad instance URL
   - ZAMMAD_TOKEN: Your Zammad API token
   - APP_PASSWORD: Password for accessing the budget manager
   - JWT_SECRET: Secret for JWT token generation
   - Volume mapping: /mnt/user/appdata/zammad-budget:/data

4. Click "Apply" to start the container

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/zammad-budget.git
cd zammad-budget
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Start development servers:
```bash
# Start backend
cd backend && npm run dev

# Start frontend (in another terminal)
cd frontend && npm run dev
```

5. Access the development server at http://localhost:5173

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| ZAMMAD_URL | Your Zammad instance URL | - |
| ZAMMAD_TOKEN | Zammad API token | - |
| APP_PASSWORD | Password for accessing the app | admin |
| JWT_SECRET | Secret for JWT tokens | - |
| DATABASE_URL | SQLite database path | file:/data/dev.db |
| PORT | Backend port | 3000 |
| NODE_ENV | Environment mode | production |

## Building from Source

1. Clone the repository:
```bash
git clone https://github.com/yourusername/zammad-budget.git
cd zammad-budget
```

2. Build the Docker image:
```bash
docker build -t zammad-budget .
```

3. Run the container:
```bash
docker run -d \
  -p 8071:80 \
  -p 3071:3000 \
  -v zammad_budget_data:/data \
  -e ZAMMAD_URL=https://your-zammad-instance.com \
  -e ZAMMAD_TOKEN=your-token \
  -e APP_PASSWORD=your-password \
  -e JWT_SECRET=your-secret \
  zammad-budget
```

## Security Considerations

1. Always use HTTPS in production
2. Set a strong APP_PASSWORD
3. Use a secure JWT_SECRET
4. Keep your Zammad token secure
5. Regularly update the application

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issue tracker.