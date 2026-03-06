# 📄 Guide de Déploiement : SÉRÉNOVA sur VPS

Ce guide récapitule les étapes exactes et les configurations validées pour installer l'application SÉRÉNOVA sur un serveur Ubuntu avec Docker et Nginx.

---

## 1. Prérequis Système
- **PostgreSQL** installé sur l'hôte VPS.
- **Docker & Docker Compose** installés.
- **Nginx & Certbot** installés.

---

## 2. Configuration PostgreSQL (Sécurité)
Pour permettre au container Docker de parler à la base de données de l'hôte de manière sécurisée :

### Création du compte dédié
```sql
-- Connectez-vous avec sudo -u postgres psql
CREATE DATABASE serenova;
CREATE USER serenova_user WITH PASSWORD 'votre_mot_de_passe_alphanumerique';
ALTER DATABASE serenova OWNER TO serenova_user;
\c serenova
GRANT ALL ON SCHEMA public TO serenova_user;
ALTER SCHEMA public OWNER TO serenova_user;
```

### Ouverture réseau locale
Dans `/etc/postgresql/*/main/postgresql.conf` :
```conf
listen_addresses = 'localhost, 172.21.0.1' # 172.21.0.1 est la passerelle de Serenova
```

Dans `/etc/postgresql/*/main/pg_hba.conf` :
```conf
# Autoriser uniquement le réseau Docker de Serenova à la DB serenova
host    serenova    all         172.21.0.0/16   scram-sha-256
```

### Firewall (UFW)
```bash
sudo ufw allow from 172.21.0.0/16 to any port 5432 comment 'Serenova DB'
sudo systemctl restart postgresql
```

---

## 3. Configuration de l'Application (.env)
Créez un fichier [.env](file:///d:/10.%20Programmation/Projets-Sheila/serenova/serenova-api/.env) à la racine du projet :
```env
# Database
DB_USER=serenova_user
DB_PASSWORD=votre_mot_de_passe_alphanumerique
DB_NAME=serenova
DB_HOST=172.21.0.1
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?schema=public

# Security
JWT_SECRET=un_secret_tres_long_et_aleatoire

# URLs
# VITE_API_URL est optionnel si vous utilisez le proxy Nginx (/api par défaut)
# Mais vous pouvez le définir pour plus de précision :
VITE_API_URL=https://serenova.bosssystemsai.com/api
FRONTEND_URL=https://serenova.bosssystemsai.com
```

---

## 4. Orchestration Docker
L'API doit utiliser une image **`node:18-slim`** pour garantir la compatibilité des bibliothèques SSL avec Prisma.

### Lancement
```bash
docker compose up -d --build
```
*Note : L'API est mappée sur le port **3005** du serveur pour éviter les conflits.*

---

## 5. Proxy Inverse Nginx
Fichier `/etc/nginx/sites-available/serenova` :
```nginx
server {
    listen 80;
    server_name serenova.bosssystemsai.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name serenova.bosssystemsai.com;

    ssl_certificate /etc/letsencrypt/live/serenova.bosssystemsai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/serenova.bosssystemsai.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:8080; # Port web docker
        proxy_set_header Host $host;
    }

    # API
    location /api {
        proxy_pass http://127.0.0.1:3005; # Port api docker
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 6. Initialisation des Données
À exécuter une fois que les containers sont lancés :

```bash
# 1. Création des tables
docker compose exec serenova-api npx prisma migrate deploy

# 2. Injection des données par défaut
docker compose exec serenova-api npm run prisma:seed
```

---

## 7. Commandes Utiles au quotidien
- **Logs** : `docker compose logs -f serenova-api`
- **Restart** : `docker compose restart`
- **Mise à jour** : `git pull origin main && docker compose up -d --build`
