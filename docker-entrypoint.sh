#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting Centrika Backend Entrypoint..."

# 1. Wait for the database to be ready
# We can use netcat (nc) to check if the database is listening
echo "⏳ Waiting for database to be ready..."
until nc -z db 5432; do
  echo "Database is unavailable - sleeping"
  sleep 1
done
echo "✅ Database is up and running!"

# 2. Synchronize the database schema
echo "🔄 Synchronizing database schema with Prisma..."
npx prisma db push --accept-data-loss

# 3. Seed the database
echo "🌱 Seeding the database..."
npx prisma db seed

# 4. Start the application
echo "🏁 Starting the application..."
if [ "$NODE_ENV" = "production" ]; then
  exec node dist/index.js
else
  exec npm run dev
fi
