#!/bin/bash

# Script de renouvellement automatique du certificat Let's Encrypt
# Ce script est à exécuter régulièrement via cron (ex: tous les mois)

CERTBOT_IMAGE="certbot/certbot"
CERTBOT_CONF_DIR="$(pwd)/certbot/conf"
CERTBOT_WEBROOT="$(pwd)/certbot/www"

sudo docker run -it --rm \
  -v "$CERTBOT_CONF_DIR:/etc/letsencrypt" \
  -v "$CERTBOT_WEBROOT:/var/www/certbot" \
  $CERTBOT_IMAGE renew --webroot --webroot-path=/var/www/certbot

# Redémarrer nginx pour appliquer le certificat renouvelé
sudo docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nginx -s reload


#Ajouter dans la crontab en tant que root 
#Renouvellement automatique du certifica
#30 3 1 * * /chemin/vers/ton/projet/scripts/certbot-renew.sh >> /var/log/certbot-renew.log 2>&1
