#!/bin/sh

#echo 'Run Backend IP-dfine script'
echo -e "\e[36m* Run Backend IP-define script * \e[0m"
mkdir -p $PWD/UserManagement/api/django_application/logs

# check IP address
BACKEND_IP=$(ip addr show enp6s0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1)
echo -e "\e[36m* Host IP: $BACKEND_IP *\e[0m"

# path to .env 
ENV_FILE="$PWD/UserManagement/api/.env"
chmod 755 $ENV_FILE

# Check if .env file exists
if [ -f "$ENV_FILE" ]; then
    if grep -q "^BACKEND_IP=" "$ENV_FILE"; then
        # Update BACKEND_IP value
        sed -i "s|^BACKEND_IP=.*|BACKEND_IP=$BACKEND_IP|" "$ENV_FILE"
    else
        # Append BACKEND_IP to .env file
        echo "BACKEND_IP=$BACKEND_IP" >> "$ENV_FILE"
    fi
else
    echo ".env file not found"
    exit 1
fi
