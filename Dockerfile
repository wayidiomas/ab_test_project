# Etapa 1: Build da aplicação
FROM node:16-alpine as build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Compilar o TypeScript
RUN npm run build

# Etapa 2: Execução da aplicação
FROM node:16-alpine

WORKDIR /usr/src/app

# Copiar os arquivos necessários do estágio de build
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/dist ./dist
RUN npm install --only=production

# Rodar o código JavaScript compilado
CMD ["node", "dist/index.js"]
