#!/bin/sh

echo -e "\e[36m* Run Frontend IP-define script * \e[0m"
# Get the HOST_IP

HOST_IP=$(ip addr show enp6s0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1)
echo -e "\e[36m* Host IP: $HOST_IP *\e[0m"

# Function to update file
update_file() {
    local file_path=$1
    local temp_file=$(mktemp)

    if grep -q "Backend_IP:" "$file_path"; then
        sed -e "s/^  Backend_IP: .*/  Backend_IP: '$HOST_IP',/" \
            -e "s|^  wsEndpoint: \`wss://.*:6010/ws/\`|  wsEndpoint: \`wss://$HOST_IP:6010/ws/\`|" \
            "$file_path" > "$temp_file"
    else
        sed -e "/};/i \  Backend_IP: '$HOST_IP'," \
            -e "/};/i \  wsEndpoint: \`wss://$HOST_IP:6010/ws/\`," \
            "$file_path" > "$temp_file"
    fi

    mv "$temp_file" "$file_path"
    chmod 644 "$file_path"
}

# Update development environment file
update_file "$PWD/FrontEnd/transcendence_front_end/src/environments/environment.development.ts"

# Update production environment file
update_file "$PWD/FrontEnd/transcendence_front_end/src/environments/environment.ts"
