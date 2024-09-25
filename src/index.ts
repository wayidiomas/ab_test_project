// src/index.ts

import Fastify from 'fastify';
import { appRoutes } from './routes';
import cors from '@fastify/cors';
import dotenv from 'dotenv';

dotenv.config();

const app = Fastify();

// Configurar CORS
app.register(cors, {
  origin: '*', // Ajuste conforme necessário para maior segurança
});

// Registrar as rotas
app.register(appRoutes);

// Iniciar o servidor
app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Servidor rodando em ${address}`);
});
