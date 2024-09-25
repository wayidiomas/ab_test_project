import { FastifyRequest, FastifyReply } from 'fastify';
import { google } from 'googleapis';
import { Link } from '../types';
import { generateRedirectScript } from '../utils/generateScript';
import dotenv from 'dotenv';

dotenv.config();

export const configureGTMHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { links, gtm_access_token, gtm_container_id, gtm_account_id } = request.body as {
    links: Link[];
    gtm_access_token?: string;
    gtm_container_id: string;
    gtm_account_id: string;
  };

  const totalPercentage = links.reduce((sum, link) => sum + link.percentage, 0);
  if (totalPercentage !== 100) {
    return reply.status(400).send({ error: 'A soma dos percentuais deve ser 100' });
  }

  try {
    const apiKey = process.env.GOOGLE_API_KEY;

    let authClient;
    if (gtm_access_token) {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: gtm_access_token });
      authClient = oauth2Client;
    } else {
      authClient = apiKey;
    }

    const tagManager = google.tagmanager({
      version: 'v2',
      auth: authClient,
    });

    const containerPath = `accounts/${gtm_account_id}/containers/${gtm_container_id}`;

    // Obter o workspace padrão
    const workspacesData = await tagManager.accounts.containers.workspaces.list({
      parent: containerPath,
    });

    const workspace = workspacesData.data.workspace?.[0];
    if (!workspace) {
      return reply.status(404).send({ error: 'Workspace não encontrado' });
    }

    const workspacePath = workspace.path!;

    const scriptContent = generateRedirectScript(links, gtm_account_id);
    const tagName = 'ABTestRedirectTag';

    // Buscar triggers (gatilhos) disponíveis no workspace
    const triggersData = await tagManager.accounts.containers.workspaces.triggers.list({
      parent: workspacePath,
    });

    let triggerId = triggersData.data.trigger?.find(trigger => trigger.name === 'All Pages')?.triggerId;

    // Se o gatilho "All Pages" não existir, cria um novo gatilho
    if (!triggerId) {
      const newTrigger = await tagManager.accounts.containers.workspaces.triggers.create({
        parent: workspacePath,
        requestBody: {
          name: 'All Pages',
          type: 'pageview', // Gatilho de visualização de página
          filter: [], // Sem filtros, dispara em todas as páginas
        },
      });
      triggerId = newTrigger.data.triggerId;
    }

    const tagsData = await tagManager.accounts.containers.workspaces.tags.list({
      parent: workspacePath,
    });

    const existingTag = tagsData.data.tag?.find((tag) => tag.name === tagName);

    const tagDefinition = {
      name: tagName,
      type: 'html',
      parameter: [
        {
          type: 'template',
          key: 'html',
          value: scriptContent,
        },
        {
          type: 'boolean',
          key: 'supportDocumentWrite',
          value: 'false',
        },
      ],
      firingTriggerId: [triggerId!], // Gatilho dinâmico
    };

    if (existingTag) {
      // Atualizar a tag existente
      await tagManager.accounts.containers.workspaces.tags.update({
        path: existingTag.path!,
        requestBody: tagDefinition,
      });
    } else {
      // Criar uma nova tag
      await tagManager.accounts.containers.workspaces.tags.create({
        parent: workspacePath,
        requestBody: tagDefinition,
      });
    }

    // Criar uma nova versão do container
    const versionResponse = await tagManager.accounts.containers.workspaces.create_version({
      path: workspacePath, // Passar o caminho correto para o workspace no parâmetro path
      requestBody: {
        name: 'Versão criada via API',
        notes: 'Atualização da tag de redirecionamento',
      },
    });

    // Verifique se a versão foi criada e publique
    const versionData = (await versionResponse).data; // Acessa 'data' corretamente após o await

    if (versionData?.containerVersion?.path) {
      await tagManager.accounts.containers.versions.publish({
        path: versionData.containerVersion.path,
      });
    }

    return reply.send({ message: 'Tag configurada com sucesso no GTM' });
  } catch (error: any) {
    console.error(error);

    if (error.code === 403) {
      return reply.status(403).send({
        error: 'Permissões insuficientes. Verifique suas credenciais.',
      });
    }

    return reply.status(500).send({ error: 'Erro ao configurar o GTM' });
  }
};
