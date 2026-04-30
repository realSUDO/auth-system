FROM node:22-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/prisma ./prisma
COPY backend/node_modules/.prisma ./node_modules/.prisma
COPY backend/node_modules/@prisma/client ./node_modules/@prisma/client
COPY backend/src ./src
COPY frontend ./frontend
CMD ["sh", "-c", "npx prisma migrate deploy && node src/app.js"]
