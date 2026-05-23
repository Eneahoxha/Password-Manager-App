FROM node:20-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate || true
EXPOSE 3001
CMD ["npm", "start"]
