# Stage 1: Build environment
FROM node:18-slim as builder

# Install system dependencies (including ffmpeg)
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    python3 \
    make \
    g++ && \
    rm -rf /var/lib/apt/lists/*

# Create and set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install --production

# Copy source files
COPY src ./src
RUN mkdir -p assets

# Create dist directory and build
RUN mkdir -p /app/dist && \
    npm run build && \
    ls -la /app/dist

# Stage 2: Production image
FROM node:18-slim

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
RUN mkdir -p assets && \
    ls -la /app

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:8080/health || exit 1

# Run the application
USER node
CMD ["node", "dist/index.js"]
