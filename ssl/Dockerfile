FROM alpine:latest

RUN apk add --no-cache openssl

WORKDIR /app/ssl

COPY certificate_generator.sh /app/ssl/
RUN chmod +x /app/ssl/certificate_generator.sh

CMD ["/app/ssl/certificate_generator.sh"]
