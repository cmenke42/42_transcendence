
SSL_IMAGE_NAME=ssl_certificate_generator
CERTS_DIR="./ssl/certs"
DOCKERFILE_DIR="./ssl"


check_certs() {
if [ ! -e ${CERTS_DIR}/certificate.crt ] || [ ! -e ${CERTS_DIR}/private.key ] || [ ! -e ${CERTS_DIR}/rootCA.crt ]; then
    echo "**\e[31m** ERROR! SSL CERTIFICATES HAVEN'T BEEN CREATED ! **\e[0m**"
    exit 1
fi
}

generate_certs() {
    cat > ${DOCKERFILE_DIR}/Dockerfile << EOF
FROM alpine:latest

RUN apk add --no-cache openssl

WORKDIR /app/ssl

COPY certificate_generator.sh /app/ssl/
RUN chmod +x /app/ssl/certificate_generator.sh

CMD ["/app/ssl/certificate_generator.sh"]
EOF

    cat > ${DOCKERFILE_DIR}/certificate_generator.sh << EOF
#!/bin/sh

# Create root CA
openssl genrsa -out rootCA.key 4096
openssl req -x509 -new -nodes -key rootCA.key -sha256 -days 1024 -out rootCA.crt -subj "/C=DE/ST=Niedersachsen/L=WOB/O=42Wolfsburg/OU=TranscendenceTeam/CN=RootCA"

# Create Key и CSR for server
openssl genrsa -out private.key 2048
openssl req -new -key private.key -out server.csr -subj "/C=DE/ST=Niedersachsen/L=WOB/O=42Wolfsburg/OU=TranscendenceTeam/CN=localhost"

# Create config file for certificate
cat > server.ext << EOL
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
EOL

# Generate certificate for server
openssl x509 -req -in server.csr -CA rootCA.crt -CAkey rootCA.key -CAcreateserial -out certificate.crt -days 365 -sha256 -extfile server.ext

# copy certificates to volume
cp certificate.crt /app/ssl/certs/
cp private.key /app/ssl/certs/
cp rootCA.crt /app/ssl/certs/



EOF

    # Create Docker image and run container to generate certificates
    docker build -t ${SSL_IMAGE_NAME} ${DOCKERFILE_DIR}
    docker run -v $(pwd)/${CERTS_DIR}:/app/ssl/certs ${SSL_IMAGE_NAME}

    # Delete container and temp. script after execution
    docker rm -f $(docker ps -a -q -f ancestor=${SSL_IMAGE_NAME})
    rm $(pwd)/ssl/certificate_generator.sh
}




# Checking the existence of certificates
if [ ! -e ${CERTS_DIR}/certificate.crt ] || [ ! -e ${CERTS_DIR}/private.key ] || [ ! -e ${CERTS_DIR}/rootCA.crt ]; then
    echo -e "\e[33m** Starting generation of SSL certificates **\e[0m"
    mkdir -p ${CERTS_DIR}
    generate_certs
    check_certs
    echo "\e[32m** SSL certificates have been successfully generated **\e[0m"
else
    echo "\e[34m** SSL certificates already exist **\e[0m"
fi



