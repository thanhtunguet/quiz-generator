# Build stage - Use Node.js to build the application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install all dependencies (including devDependencies)
COPY package.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Production stage - Fresh Node.js alpine image with only production dependencies
FROM node:18-alpine AS production

WORKDIR /app

# Copy package.json and install only production dependencies
COPY package.json ./
RUN npm install --only=production && npm cache clean --force

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of app directory to nestjs user
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

CMD ["npm", "run", "start:prod"]