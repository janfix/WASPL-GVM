SHELL := /bin/bash

prod:
	@echo "🚀 Démarrage des services WASPL en mode PRODUCTION..."
	docker-compose up --build -d

down:
	@echo "🔝 Arrêt et suppression des containers..."
	docker-compose down --remove-orphans

reset-db:
	@echo "🤨 Suppression du dossier ./mongodb..."
	rmdir /S /Q mongodb
	@echo "🛉 Nettoyage des volumes Docker inutilisés..."
	docker volume prune -f

reset-all: 
	@echo "🛑 Arrêt et suppression des containers..."
	docker-compose down --remove-orphans
	@echo "🗑️ Suppression des containers restants..."
	-@for /f "delims=" %%i in ('docker ps -aq --filter "name=waspl"') do docker rm -f %%i
	@echo "🧼 Suppression des images Docker locales..."
	docker rmi -f waspl-waspleditor waspl-waspltestrunner || exit 0
