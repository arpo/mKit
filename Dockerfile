# Use the official Node.js image as base
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server files and pre-built client dist
# Ensure both source and destination end with '/' when copying directories
COPY server/ ./server/
COPY client/dist/ ./client/dist/

# Use a smaller image for runtime
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Set Node environment to production for the final image
ENV NODE_ENV production

# Copy built files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
# Ensure both source and destination end with '/' when copying directories from builder
COPY --from=builder /app/server/ ./server/
COPY --from=builder /app/client/dist/ ./client/dist/

# Expose port (matches server.cjs PORT env var)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

# Start the server (NODE_ENV is now set via ENV instruction)
CMD ["node", "server/server.cjs"]
