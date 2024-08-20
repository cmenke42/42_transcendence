
all: set_permissions
	./UserManagement/nginx/entrypoint.sh
	./ssl/generate_certificates.sh
	./FrontEnd/docker/init.sh
	$(MAKE) build

set_permissions:
	chmod +x UserManagement/nginx/entrypoint.sh \
			 ssl/generate_certificates.sh \
			 UserManagement/api/docker/init.sh \
			 FrontEnd/docker/init.sh

up:
	echo "** Starting containers **"
	docker-compose up

build:
	echo "** Starting build **"
	docker-compose up --build
	echo "** Build has been completed **"

down:
	echo "** Stopping containers **"
	docker-compose down

clean:
	echo "** Cleaning up down -v **"
	docker-compose down -v

re: clean all

