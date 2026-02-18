# Build stage for frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app

# ARGs for Vite build
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_GEMINI_API_KEY

COPY package*.json ./
RUN npm install
COPY . .

# Convert ARGs to ENVs
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

# Generate .env file for Vite build (Ensures visibility)
RUN echo "VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY" > .env && \
    echo "VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN" >> .env && \
    echo "VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID" >> .env && \
    echo "VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET" >> .env && \
    echo "VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID" >> .env && \
    echo "VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID" >> .env && \
    echo "VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY" >> .env && \
    echo "Build-time Check: API Key is set to $VITE_FIREBASE_API_KEY (first few chars)"

RUN npm run build

# Production stage
FROM node:20-slim
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built frontend assets
COPY --from=frontend-builder /app/dist ./dist

# Copy backend source
COPY server.ts ./
COPY tsconfig.json ./

# Install tsx to run typescript directly in production for simplicity
# Or we could compile it, but tsx is fine for this scale
RUN npm install -g tsx

# Environment variables (placeholders - should be set in Cloud Run)
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD ["tsx", "server.ts"]
