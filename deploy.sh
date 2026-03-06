#!/bin/bash

echo "🚀 Initialisation de SÉRÉNOVA sur le VPS..."

# 1. Vérification Docker
if ! [ -x "$(command -v docker)" ]; then
  echo "❌ Erreur: Docker n'est pas installé." >&2
  exit 1
fi

# 2. Détection de l'IP Host pour la DB (Postgres physique)
# On essaie de trouver l'IP du bridge docker par défaut
HOST_IP=$(ip -4 addr show docker0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}' || echo "172.17.0.1")

# 3. Création du fichier .env si inexistant
if [ ! -f .env ]; then
  echo "📝 Création du fichier .env par défaut..."
  cat <<EOT >> .env
DATABASE_URL=postgresql://user:password@${HOST_IP}:5432/serenova
JWT_SECRET=$(openssl rand -base64 32)
VITE_API_URL=https://serenova.bosssystemsai.com/api
FRONTEND_URL=https://serenova.bosssystemsai.com
EOT
  echo "⚠️  Veuillez éditer le fichier .env avec vos vrais accès PostgreSQL !"
  echo "💡 Note: L'IP de votre host Docker est détectée comme ${HOST_IP}"
fi

# 4. Configuration Nginx
echo "🌐 Vérification de la configuration Nginx..."
if [ -d "/etc/nginx/sites-available" ]; then
  sudo cp serenova.nginx.conf /etc/nginx/sites-available/serenova
  sudo ln -sf /etc/nginx/sites-available/serenova /etc/nginx/sites-enabled/
  sudo nginx -t && sudo systemctl reload nginx
  echo "✅ Nginx configuré pour serenova.bosssystemsai.com"
else
  echo "ℹ️  Dossier Nginx non standard ou non trouvé localement."
fi

# 5. Build et Lancement
echo "📦 Build et lancement des containers..."
docker-compose up -d --build

# 6. Migration et Seed
echo "🗄️ Initialisation de la base de données..."
docker-compose exec -T serenova-api npx prisma migrate deploy
docker-compose exec -T serenova-api npm run prisma:seed

echo "✅ SÉRÉNOVA est déployé !"
echo "👉 Accès : https://serenova.bosssystemsai.com"
