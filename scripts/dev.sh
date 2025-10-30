#!/bin/bash

# Vibe Code Development Helper Script

COMMAND=$1

case $COMMAND in
  start)
    echo "🚀 Starting Vibe Code services..."
    docker-compose up
    ;;
  
  stop)
    echo "🛑 Stopping Vibe Code services..."
    docker-compose down
    ;;
  
  restart)
    echo "🔄 Restarting Vibe Code services..."
    docker-compose restart
    ;;
  
  logs)
    SERVICE=$2
    if [ -z "$SERVICE" ]; then
      docker-compose logs -f
    else
      docker-compose logs -f $SERVICE
    fi
    ;;
  
  shell)
    SERVICE=$2
    if [ -z "$SERVICE" ]; then
      echo "Usage: ./scripts/dev.sh shell <service-name>"
      echo "Available services: api-gateway, auth-service, user-service, project-service, compiler-service, collaboration-service, notification-service"
    else
      docker-compose exec $SERVICE sh
    fi
    ;;
  
  db)
    echo "🗄️  Connecting to PostgreSQL..."
    docker-compose exec postgres psql -U vibe_user -d vibe_code
    ;;
  
  redis-cli)
    echo "📦 Connecting to Redis..."
    docker-compose exec redis redis-cli
    ;;
  
  migrate)
    SERVICE=$2
    if [ -z "$SERVICE" ]; then
      echo "Running all migrations..."
      npm run migrate:all
    else
      echo "Running migration for $SERVICE..."
      cd services/$SERVICE && npx prisma migrate deploy && cd ../..
    fi
    ;;
  
  reset)
    echo "⚠️  WARNING: This will delete all data!"
    read -p "Are you sure you want to reset the database? (yes/no) " -r
    if [[ $REPLY == "yes" ]]; then
      docker-compose down -v
      docker-compose up -d postgres redis nats
      sleep 5
      npm run migrate:all
      echo "✅ Database reset complete"
    else
      echo "❌ Reset cancelled"
    fi
    ;;
  
  clean)
    echo "🧹 Cleaning up Docker resources..."
    docker-compose down -v
    docker system prune -f
    echo "✅ Cleanup complete"
    ;;
  
  build)
    SERVICE=$2
    if [ -z "$SERVICE" ]; then
      echo "Building all services..."
      docker-compose build
    else
      echo "Building $SERVICE..."
      docker-compose build $SERVICE
    fi
    ;;
  
  test)
    SERVICE=$2
    if [ -z "$SERVICE" ]; then
      echo "Running all tests..."
      npm test
    else
      echo "Running tests for $SERVICE..."
      cd services/$SERVICE && npm test && cd ../..
    fi
    ;;
  
  *)
    echo "Vibe Code Development Helper"
    echo ""
    echo "Usage: ./scripts/dev.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo "  start               Start all services"
    echo "  stop                Stop all services"
    echo "  restart             Restart all services"
    echo "  logs [service]      View logs (all or specific service)"
    echo "  shell <service>     Open shell in service container"
    echo "  db                  Connect to PostgreSQL"
    echo "  redis-cli           Connect to Redis"
    echo "  migrate [service]   Run database migrations"
    echo "  reset               Reset database (WARNING: deletes all data)"
    echo "  clean               Clean up Docker resources"
    echo "  build [service]     Build Docker images"
    echo "  test [service]      Run tests"
    echo ""
    ;;
esac
