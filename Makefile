HOST_IP := $(shell ip route get 1 | awk '{print $$7;exit}')
#export HOST_IP

all: set_permissions
	echo "HOST_IP=$(HOST_IP)"
	./UserManagement/nginx/entrypoint.sh
	./ssl/generate_certificates.sh
	./UserManagement/api/docker/init.sh
	./FrontEnd/docker/init.sh
	$(MAKE) build

set_permissions:
	chmod +x UserManagement/nginx/entrypoint.sh \
			 ssl/generate_certificates.sh \
			 UserManagement/api/docker/init.sh \
			 FrontEnd/docker/init.sh

up:
	echo "** Starting containers **"
	HOST_IP=$(HOST_IP) docker-compose up

build:
	echo "** Starting build **"
	HOST_IP=$(HOST_IP) docker-compose up --build
	echo "** Build has been completed **"

down:
	echo "** Stopping containers **"
	docker-compose down

clean:
	echo "** Cleaning up down -v **"
	docker-compose down -v

re: clean all

