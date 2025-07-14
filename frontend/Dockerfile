# Stage 1: Build the Astro application
FROM node:22-alpine3.20 AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@latest

# Copy package.json files for dependency caching
COPY package.json pnpm-lock.yaml ./
RUN pnpm install 

# Copy application source code
COPY . .

# Copy example environment file (if needed for build-time variables)
# Astro uses import.meta.env.PUBLIC_VAR for client-side variables, and regular env vars for server-side
RUN cp .env.example .env || true # Use || true to prevent error if .env.example doesn't exist

# Build the Astro application
# This will prepare the app for Node.js runtime
RUN pnpm run build

# Stage 2: Run the Astro application in production
FROM node:22-alpine3.20 AS runner

WORKDIR /app

# Install pnpm globally for runtime (if needed, though 'npm' might suffice if not running pnpm commands)
RUN npm install -g pnpm@latest

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set production environment
ENV NODE_ENV=production

# Copy essential built files and runtime dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist 
COPY --from=builder /app/.env ./.env 

# Set file ownership to non-root user
RUN chown -R appuser:appgroup /app

# Expose the default port for 'astro preview' or Node.js server
EXPOSE 4321 

# Healthcheck to verify application readiness
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4321/ || exit 1

# Switch to non-root user
USER appuser

# Start the Astro application in preview/production mode
# Astro's `preview` script typically uses the built output.
# If you have a custom start command for SSR, use that instead (e.g., `node ./dist/server/entry.mjs`)
CMD ["node", "dist/server/entry.mjs"]