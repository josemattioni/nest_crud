# Nest CRUD

A simple CRUD (Create, Read, Update, Delete) API built with [NestJS](https://nestjs.com/) and TypeORM.

## Features

- User authentication (JWT)
- User management (CRUD)
- Message management (CRUD)
- Static file serving
- Environment-based configuration

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- PostgreSQL

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   cd nest_crud
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env` and update the values as needed.

### Running the App

```bash
npm run start:dev
# or
yarn start:dev
```

The API will be available at `http://localhost:3000`.

### Project Structure

- `src/app` - Main application module
- `src/users` - User module and logic
- `src/messages` - Message module and logic
- `src/auth` - Authentication module
- `src/global-config` - Global configuration

### Static Files

Static files are served from the `/pictures` route.