FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3721
CMD ["sh", "-c", "npx prisma db push && npx tsx src/seed.ts && npx tsx src/index.ts"]
