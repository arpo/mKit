# Use an official Node.js runtime as a parent image
# Using alpine for a smaller image size
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package files for both server and client
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies for server and client
RUN npm ci --only=production
RUN cd client && npm ci --only=production && cd ..

# Copy built files
COPY dist/ ./dist/
COPY client/dist/ ./client/dist/
COPY public/ ./public/

# The application listens on the port defined by the PORT environment variable.
# Cloud Run automatically sets this variable. We don't need to EXPOSE it here,
# but the server code needs to respect process.env.PORT.
# EXPOSE 8080 # (Optional, for documentation/local use)

# Define the command to run your app
CMD ["node", "dist/server.js"]
