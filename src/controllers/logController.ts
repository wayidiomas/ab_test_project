import { FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../services/supabaseService';

export const logAccessHandler = async (
  request: FastifyRequest, // Utilize FastifyRequest genérico
  reply: FastifyReply
) => {
  // Converta o corpo da requisição explicitamente para o formato esperado
  const { user_id, page_url } = request.body as { user_id: string; page_url: string };

  const ipAddress = request.headers['x-forwarded-for'] || request.ip;
  const userAgent = request.headers['user-agent'] || 'Unknown';

  try {
    const { data, error } = await supabase.from('access_logs').insert([
      {
        user_id,
        page_url,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    ]);

    if (error) {
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao registrar o acesso' });
    }

    return reply.send({ message: 'Acesso registrado com sucesso' });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Erro interno do servidor' });
  }
};
