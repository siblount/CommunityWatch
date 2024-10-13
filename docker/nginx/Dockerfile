FROM nginx:alpine

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy the custom Nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Create a directory for certificates (for later use)
RUN mkdir -p /etc/nginx/certs

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]