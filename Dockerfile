# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
# Using --chown here ensures files are owned by nodejs user
# Note: Adding a cache-busting timestamp via build arg helps force rebuilds when code changes
ARG BUILD_DATE=unknown
LABEL build_date=$BUILD_DATE
COPY --chown=nodejs:nodejs . .

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port (if needed for health checks)
EXPOSE 3000

# Start the application
CMD ["node", "src/index.js"]
