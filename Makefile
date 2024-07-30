
all:
	chmod +x UserManagement/nginx/entrypoint.sh && chmod +x ssl/generate_certificates.sh && chmod +x UserManagement/api/docker/init.sh
	./UserManagement/nginx/entrypoint.sh
	./UserManagement/api/docker/init.sh
	./ssl/generate_certificates.sh
	$(MAKE) build

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

