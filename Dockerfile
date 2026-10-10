# Use lightweight official Node.js Alpine image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy website files and assets
COPY . .

# Expose server port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Start HTTP server
CMD ["node", "server.js"]
