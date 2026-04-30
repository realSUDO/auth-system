FROM node:22-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/prisma ./prisma
RUN npx prisma generate
COPY backend/src ./src
COPY frontend ./frontend
CMD ["sh", "-c", "npx prisma migrate deploy && node src/app.js"]
