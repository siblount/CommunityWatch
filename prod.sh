#!/bin/bash

# Check if JWT_SECRET is already set
if [ -z "$JWT_SECRET" ]; then
    echo "JWT_SECRET not set. Generating a new one..."
    JWT_SECRET=$(openssl rand -base64 32)
else
    echo "Using existing JWT_SECRET"
fi

# Check if JWT_SECRET is already set
if [ -z "$CSRF_SECRET" ]; then
    echo "CSRF_SECRET not set. Generating a new one..."
    CSRF_SECRET=$(openssl rand -base64 32)
else
    echo "Using existing CSRF_SECRET"
fi

# Export secrets
export JWT_SECRET
export CSRF_SECRET

# Create or update .env file
echo "JWT_SECRET=${JWT_SECRET}" > .env
echo "CSRF_SECRET=${CSRF_SECRET}" >> .env

# Print the first few characters of JWT_SECRET (for debugging, remove in production)
echo "JWT_SECRET: ${JWT_SECRET:0:5}..."
echo "CSRF_SECRET: ${CSRF_SECRET:0:5}..."

# Run docker-compose
docker compose --file docker-compose.yml --env-file .env up --build