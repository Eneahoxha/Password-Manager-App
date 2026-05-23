FROM node:20-buster-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate || true
EXPOSE 3001
CMD ["npm", "start"]
