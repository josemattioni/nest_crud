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
- PostgreSQL (for local development)
- Docker Desktop (for containerized development)
- kubectl (for Kubernetes deployment)

## Running the Application

### Option 1: Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/nest_crud.git
   cd nest_crud
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env` and update the values as needed.
   - Make sure PostgreSQL is running locally.

4. Run the application:
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3000`.

### Option 2: Docker Compose

1. Clone the repository and navigate to the project folder.

2. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

3. The API will be available at `http://localhost:3000`.
4. PostgreSQL will be available at `localhost:5433`.

To stop the containers:
```bash
docker-compose down
```

### Option 3: Kubernetes

#### Prerequisites
- Docker Desktop with Kubernetes enabled, or Minikube
- kubectl installed

#### Steps

1. **Create Kubernetes Secrets:**
   ```bash
   # Create base64 encoded values for your secrets
   echo -n 'your-database-password' | base64
   echo -n 'your-jwt-secret' | base64
   
   # Create secret.yaml with your encoded values
   kubectl apply -f secret.yaml
   ```

2. **Deploy PostgreSQL:**
   ```bash
   kubectl apply -f postgres-deployment.yaml
   ```

3. **Build and push your Docker image:**
   ```bash
   docker build -t your-dockerhub-username/nest-crud:latest .
   docker push your-dockerhub-username/nest-crud:latest
   ```

4. **Deploy the application:**
   ```bash
   kubectl apply -f app-deployment.yaml
   ```

5. **Access the application:**
   - The API will be available at `http://localhost:30080`
   - Or use port forwarding: `kubectl port-forward svc/nest-crud 3000:3000`

#### Useful Kubernetes Commands

```bash
# Check pod status
kubectl get pods

# Check services
kubectl get services

# View logs
kubectl logs <pod-name>

# Delete all resources
kubectl delete -f .
```

## Project Structure

- `src/app` - Main application module
- `src/users` - User module and logic
- `src/messages` - Message module and logic
- `src/auth` - Authentication module
- `src/global-config` - Global configuration

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_TYPE` | Database type | `postgres` |
| `DATABASE_HOST` | Database host | `localhost` |
| `DATABASE_PORT` | Database port | `5432` |
| `DATABASE_USERNAME` | Database username | `postgres` |
| `DATABASE_PASSWORD` | Database password | - |
| `DATABASE_DATABASE` | Database name | `nest_crud` |
| `JWT_SECRET` | JWT secret key | - |

### Static Files

Static files are served from the `/pictures` route.

## Security Notes

- Never commit `.env` files or `secret.yaml` with real credentials to version control.
- Use Kubernetes Secrets for sensitive data in production.
- Change default passwords and secrets before deploying to production.

## License

MIT