# Stage 1: Build the application
FROM node:20 AS builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependency definition files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
# Using --frozen-lockfile ensures we use the exact versions from the lock file
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Exclude files not needed for build (like node_modules already installed)
# This potentially duplicates .dockerignore but ensures build stage is clean if context changes
RUN echo "node_modules" > .dockerignore && \
    echo ".next" >> .dockerignore && \
    echo ".git" >> .dockerignore

# Build the Next.js application
RUN pnpm build

# Remove development dependencies after build
RUN pnpm prune --prod


# Stage 2: Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV RUNNING_IN_DOCKER=true
# Uncomment the following line if you need to specify a hostname
# ENV HOSTNAME="0.0.0.0"
# Set the default port
ENV PORT=3000

# Install pnpm (needed if start.sh uses pnpm commands, otherwise could potentially be removed)
RUN npm install -g pnpm

# Copy necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# Copy next.config.ts if it exists and is needed at runtime
# COPY --from=builder /app/next.config.ts ./next.config.ts
# Copy start.sh script
COPY --from=builder /app/start.sh ./start.sh

# Ensure start.sh is executable
RUN chmod +x ./start.sh

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application using the start script
CMD ["./start.sh", "start"] 