FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit --progress=false
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node","server.js"]
