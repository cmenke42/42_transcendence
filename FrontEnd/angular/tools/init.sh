
env_file=".env"
echo -e "\e[36m* Run Frontend IP-define script * \e[0m"

# Read HOST_IP from .env file
if [ -f $env_file ]; then
    HOST_IP=$(grep '^HOST_IP=' $env_file | cut -d '=' -f2)
    if [ -z "$HOST_IP" ]; then
        echo -e "\e[31mError: HOST_IP not found or empty in .env file\e[0m"
        exit 1
    fi
else
    echo -e "\e[31mError: .env file not found\e[0m"
    exit 1
fi

echo -e "\e[36m* Host IP: $HOST_IP *\e[0m"

# Function to update file
update_file() {
    local file_path=$1
    local temp_file=$(mktemp)

    # Check if HOST_IP exists and update or add it
    if grep -q "HOST_IP:" "$file_path"; then
        sed -i "s|HOST_IP:.*|HOST_IP: '$HOST_IP',|" "$file_path"
    else
        sed -i "/};/i \  HOST_IP: '$HOST_IP'," "$file_path"
    fi

    # Check if wsEndpoint exists and update or add it
    if grep -q "wsEndpoint:" "$file_path"; then
        sed -i "s|wsEndpoint:.*|wsEndpoint: \`wss://$HOST_IP:6010/ws/\`,|" "$file_path"
    else
        sed -i "/};/i \  wsEndpoint: \`wss://$HOST_IP:6010/ws/\`," "$file_path"
    fi

    chmod 644 "$file_path"
}

# Update development environment file
update_file "$PWD/FrontEnd/angular/srcs/src/environments/environment.development.ts"


# Update production environment file
update_file "$PWD/FrontEnd/angular/srcs/src/environments/environment.ts"