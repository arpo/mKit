# Use an official Node.js runtime as a parent image
# Using alpine for a smaller image size
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or npm-shrinkwrap.json)
# Using package-lock.json ensures reproducible installs
COPY package*.json ./

# Install production dependencies using npm ci for faster, reliable builds
# --only=production avoids installing devDependencies
RUN npm ci --only=production

# Bundle app source code
# Copy the compiled TypeScript code (dist) and static assets (public)
COPY dist/ ./dist/
COPY public/ ./public/

# The application listens on the port defined by the PORT environment variable.
# Cloud Run automatically sets this variable. We don't need to EXPOSE it here,
# but the server code needs to respect process.env.PORT.
# EXPOSE 8080 # (Optional, for documentation/local use)

# Define the command to run your app
CMD ["node", "dist/server.js"]
