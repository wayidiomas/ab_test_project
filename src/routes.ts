import { FastifyInstance } from 'fastify';
import { configureGTMHandler } from './controllers/gtmController';
import { logAccessHandler } from './controllers/logController';

export const appRoutes = async (app: FastifyInstance) => {
  // Esquema para a rota /configure-gtm
  const configureGTMSchema = {
    body: {
      type: 'object',
      properties: {
        links: { type: 'array', items: { type: 'object', properties: { url: { type: 'string' }, percentage: { type: 'number' } }, required: ['url', 'percentage'] } },
        gtm_access_token: { type: 'string', nullable: true },
        gtm_container_id: { type: 'string' },
        gtm_account_id: { type: 'string' },
      },
      required: ['links', 'gtm_container_id', 'gtm_account_id'],
    },
  };

  // Esquema para a rota /log-access
  const logAccessSchema = {
    body: {
      type: 'object',
      properties: {
        user_id: { type: 'string' },
        page_url: { type: 'string' },
      },
      required: ['user_id', 'page_url'],
    },
  };

  // Registrar rotas com esquema
  app.post('/configure-gtm', { schema: configureGTMSchema }, configureGTMHandler);
  app.post('/log-access', { schema: logAccessSchema }, logAccessHandler);
};
