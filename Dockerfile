# Usar uma imagem base oficial do Node.js
FROM node:18-alpine

# Definir o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copiar o arquivo package.json e package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instalar as dependências do projeto
RUN npm install

# Copiar o restante do código da aplicação
COPY . .

# Expor a porta que o Fastify ou outro servidor vai rodar
EXPOSE 3000

# Definir a variável de ambiente para produção (opcional)
ENV NODE_ENV=production

# Iniciar a aplicação
CMD [ "npm", "run", "dev" ]
