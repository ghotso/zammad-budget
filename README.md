# Zammad Budget Manager

A budget management application for Zammad organizations that tracks and manages time budgets with multi-language support.

## Features

- 🕒 Track and manage time budgets for Zammad organizations
- 🔐 Simple password-based authentication
- 🌐 Multi-language support (English/German)
- 📊 Monthly tracking overview
- 💼 Budget history with descriptions
- 🎨 Modern dark theme with glassmorphism effects
- 🐳 Docker-ready deployment

## Prerequisites

- Node.js 20 or higher
- Docker and Docker Compose (for production deployment)
- A running Zammad instance with API access

## Environment Variables

### Backend (.env)

```env
ZAMMAD_URL=https://your-zammad-instance.com
ZAMMAD_TOKEN=your_zammad_api_token
APP_PASSWORD=your_app_password
JWT_SECRET=your_jwt_secret
PORT=3000
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
```

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/zammad-budget.git
cd zammad-budget
```

2. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Set up environment variables:
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your settings
```

4. Start development servers:
```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm run dev
```

## Docker Deployment

1. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your settings
```

2. Build and start containers:
```bash
docker-compose up -d
```

The application will be available at:
- Frontend: http://localhost
- Backend API: http://localhost:3000

## Usage

1. Access the application at http://localhost
2. Log in using the configured APP_PASSWORD
3. View and manage organization budgets
4. Use the settings page to change language

## Features

### Budget Management
- View total budget and tracked time
- Add or remove budget with descriptions
- View budget history
- Monthly tracking overview

### Settings
- Switch between English and German
- More settings can be added in the future

### Authentication
- Simple password-based authentication
- Password configurable via environment variable

## Docker Support

The application is containerized and ready for deployment on Linux servers:
- Frontend uses nginx for serving static files
- Backend runs in Node.js container
- SQLite database persisted through Docker volume
- Health checks configured for both services
- Automatic container restart on failure

## Technical Stack

### Frontend
- React with TypeScript
- Vite for building
- TailwindCSS for styling
- React Query for data fetching
- Radix UI components
- Glassmorphism design

### Backend
- Node.js with TypeScript
- Hono for API
- Prisma with SQLite
- JWT authentication
- Docker multi-stage builds

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.