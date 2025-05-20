#!/bin/sh
# Script : wait-for-mongo.sh
# But : attendre que MongoDB soit prêt avant de lancer l'application

set -e

host="mongodb"
port="27017"

until nc -z "$host" "$port"; do
  echo "⏳ En attente de MongoDB à $host:$port..."
  sleep 2
done

echo "✅ MongoDB est prêt !"

exec "$@"
