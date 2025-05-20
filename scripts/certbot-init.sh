#!/bin/bash

# Ce script lance Certbot pour générer un certificat Let's Encrypt pour waspldemo.wiquid.fr
# Assurez-vous que le conteneur nginx tourne déjà avec le port 80 exposé

DOMAIN="waspldemo.wiquid.fr"
EMAIL="contact@wiquid.fr"  # Remplacez par votre email
WEBROOT="$(pwd)/certbot/www"
CERTBOT_IMAGE="certbot/certbot"

mkdir -p "$WEBROOT"

sudo docker run -it --rm \
  -v "$WEBROOT:/var/www/certbot" \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
  $CERTBOT_IMAGE certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email "$EMAIL" --agree-tos --no-eff-email \
  -d "$DOMAIN"

# Une fois le certificat généré, redémarrer NGINX si nécessaire
# docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart nginx
