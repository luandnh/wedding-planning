# Stage 1: Build dependencies and Prisma client
FROM node:22-alpine3.20 AS builder

WORKDIR /app

# Copy package.json files for dependency caching
COPY package*.json ./

# Install dependencies, including devDependencies for Prisma
RUN npm install

# Copy application source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Stage 2: Create production-ready image
FROM node:22-alpine3.20 AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set production environment
ENV NODE_ENV=production

# Copy essential files from builder stage
COPY --from=builder /app ./

# Set file ownership to non-root user
RUN chown -R appuser:appgroup /app

# Expose backend application port (ensure this matches your Express app's listen port)
EXPOSE 3001

# Healthcheck to verify application readiness
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# Switch to non-root user
USER appuser

# Start the backend application
CMD ["node", "index.js"]