#!/bin/bash

# Vibe Code Development Environment Setup Script

set -e

echo "🎵 Setting up Vibe Code development environment..."

# Check prerequisites
check_prerequisites() {
  echo "Checking prerequisites..."
  
  # Check Node.js
  if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
  fi
  
  NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
  fi
  echo "✅ Node.js $(node -v)"
  
  # Check Docker
  if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
  fi
  echo "✅ Docker $(docker --version)"
  
  # Check Docker Compose
  if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
  fi
  echo "✅ Docker Compose $(docker-compose --version)"
}

# Create environment file
setup_env() {
  echo ""
  echo "Setting up environment variables..."
  
  if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please update .env with your configuration before starting services"
  else
    echo "ℹ️  .env file already exists"
  fi
}

# Install dependencies
install_dependencies() {
  echo ""
  echo "Installing dependencies..."
  
  # Root dependencies
  echo "Installing root dependencies..."
  npm install
  
  # Shared packages
  echo "Building shared packages..."
  cd shared/types && npm install && npm run build && cd ../..
  cd shared/utils && npm install && npm run build && cd ../..
  
  echo "✅ Dependencies installed"
}

# Build Docker images
build_images() {
  echo ""
  read -p "Would you like to build Docker images now? (y/n) " -n 1 -r
  echo
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Building Docker images..."
    docker-compose build
    echo "✅ Docker images built"
  else
    echo "⏭️  Skipping Docker image build"
  fi
}

# Initialize databases
init_databases() {
  echo ""
  read -p "Would you like to start services and initialize databases? (y/n) " -n 1 -r
  echo
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting PostgreSQL, Redis, and NATS..."
    docker-compose up -d postgres redis nats
    
    echo "Waiting for databases to be ready..."
    sleep 10
    
    echo "✅ Infrastructure services started"
    echo "ℹ️  Run 'npm run migrate:all' to set up database schemas"
  else
    echo "⏭️  Skipping service startup"
  fi
}

# Main setup flow
main() {
  echo ""
  echo "╔════════════════════════════════════════╗"
  echo "║   🎵 Vibe Code Setup Script           ║"
  echo "╚════════════════════════════════════════╝"
  echo ""
  
  check_prerequisites
  setup_env
  install_dependencies
  build_images
  init_databases
  
  echo ""
  echo "╔════════════════════════════════════════╗"
  echo "║   ✅ Setup Complete!                   ║"
  echo "╚════════════════════════════════════════╝"
  echo ""
  echo "Next steps:"
  echo "1. Update .env file with your configuration"
  echo "2. Run 'npm run migrate:all' to set up databases"
  echo "3. Run 'npm run dev' to start all services"
  echo "4. Open http://localhost:3000 in your browser"
  echo ""
  echo "For more information, see README.md"
}

main
