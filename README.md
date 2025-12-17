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
## ⏱️ Time Report

| Section | Time Spent | Details |
| :--- | :--- | :--- |
| **Project Setup & Docker** | 1.5 hrs | Initial NestJS setup, Docker Compose configuration (Postgres, Redis), and Environment configuration. |
| **Authentication Module** | 2.5 hrs | Implementing the "Single Flow" (Login/Register) logic, JWT strategies, and Guards. |
| **Team Generation (Async)** | 3.0 hrs | Setting up BullMQ for background processing, implementing logic to generate random players (GK, Def, Mid, Att) with initial values. |
| **Marketplace & Transactions**| 5.0 hrs | Core business logic for transfers. Includes handling concurrency (pessimistic locking), validations (95% rule, team size limits), and financial calculations using `decimal.js`. |
| **Refactoring & QA** | 2.0 hrs | Code cleanup, adding DTO validation pipes, and verifying end-to-end flows. |
| **Documentation** | 0.5 hrs | Writing README and usage instructions. |
| **Total** | **~14.5 hrs** | |