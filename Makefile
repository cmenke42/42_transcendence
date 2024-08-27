all: set_permissions
	./Backend/nginx/tools/entrypoint.sh
	./FrontEnd/angular/tools/init.sh
	$(MAKE) build

set_permissions:
	chmod +x Backend/nginx/tools/entrypoint.sh \
			 FrontEnd/angular/tools/init.sh

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

PHONY: all set_permissions up build down clean re