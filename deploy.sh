#!/bin/bash

echo "🚀 Initialisation de SÉRÉNOVA sur le VPS..."

# 1. Vérification Docker
if ! [ -x "$(command -v docker)" ]; then
  echo "❌ Erreur: Docker n'est pas installé." >&2
  exit 1
fi

# 2. Création du fichier .env si inexistant
if [ ! -f .env ]; then
  echo "📝 Création du fichier .env par défaut..."
  cat <<EOT >> .env
DATABASE_URL=postgresql://user:password@localhost:5432/serenova
JWT_SECRET=$(openssl rand -base64 32)
VITE_API_URL=http://localhost:3000/api
FRONTEND_URL=http://localhost
EOT
  echo "⚠️  Veuillez éditer le fichier .env avec vos vrais accès PostgreSQL !"
fi

# 3. Pull / Build
echo "📦 Build des containers..."
docker-compose build

# 4. Migration et Seed (via container API)
echo "🗄️ Application des migrations Prisma..."
docker-compose run serenova-api npx prisma migrate deploy
docker-compose run serenova-api npm run prisma:seed

# 5. Lancement
echo "🟢 Lancement de l'application..."
docker-compose up -d

echo "✅ SÉRÉNOVA est en ligne !"
