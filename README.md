# FlairTech API

A football team management and player marketplace API built with NestJS.

## Prerequisites

- Docker & Docker Compose

## Quick Start

1. **Clone and setup environment**
   ```bash
   cp .env.example .env
   ```

2. **Start the application**
   ```bash
   docker compose up -d
   ```

3. **Access the API**
   - API: http://localhost:7777
   - Swagger Docs: http://localhost:7777/api-docs

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login or register (auto-creates account) |
| GET | `/team` | Get your team info |
| GET | `/market` | List players for sale |
| POST | `/market` | List a player for sale |
| DELETE | `/market/:id` | Delist a player |
| POST | `/player/buy` | Buy a listed player |

## Environment Variables

See `.env.example` for all available configuration options.

## Development

```bash
# Stop services
docker compose down

# Rebuild after code changes
docker compose build api && docker compose up -d

# View logs
docker logs flairtech-api -f
```
