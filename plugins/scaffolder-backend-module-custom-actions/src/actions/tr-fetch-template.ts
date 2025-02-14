import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { InputError } from '@backstage/errors';
import fs from 'fs/promises';
import path from 'path';
import nunjucks from 'nunjucks'; // Importando o Nunjucks

export const trFetchTemplate = () => {
  return createTemplateAction<{ items: any[]; sourcePath: string; targetPath: string; }>({
    id: 'tr:fetch:template',
    schema: {
      input: {
        type: 'object',
        required: ['items', 'sourcePath', 'targetPath'],
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'path'],
              properties: {
                name: { type: 'string' },
                path: { type: 'string' },
                values: {
                  type: 'array',
                  description: 'A list of key-value pairs for each component.',
                  items: {
                    type: 'object',
                    properties: {
                      key: { type: 'string' },
                      value: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
          sourcePath: { type: 'string' },
          targetPath: { type: 'string' },
        },
      },
    },
    async handler(ctx) {
      const { items, sourcePath, targetPath } = ctx.input;
      ctx.logger.info(`SourcePath: ${sourcePath} TargetPath: ${targetPath}`);
      ctx.logger.info(`Items to process: ${JSON.stringify(items)}`);
      
      if (!Array.isArray(items)) {
        throw new InputError('Items must be an array');
      }

      for (const item of items) {
        ctx.logger.info(`Processing template for item: ${item.name} Path: ${item.path}`);

        // Adicionando lógica para incluir os Values no contexto de renderização
        //const values = item.values ? Object.fromEntries(item.values.map((kv: { key: string; value: string; }) => [kv.key, kv.value])) : {};

//        const values = item.values ? {
//          values: Object.fromEntries(item.values.map((kv: { key: string; value: string; }) => [kv.key, kv.value]))
//        } : { values: {} };

        const values = item.values ? {
          values: {
            ...Object.fromEntries(item.values.map((kv: { key: string; value: string; }) => [kv.key, kv.value])),
            extraValues: item.values.map((kv: { key: string; value: string; }) => ({
              key: kv.key,
              value: kv.value
            }))
          }
        } : { values: { extraValues: [] } };

        

        const templatePath = path.join(ctx.workspacePath, sourcePath, item.path);
        const outputPath = path.join(ctx.workspacePath, targetPath, item.path);

        try {
          ctx.logger.info(`Checking if file/folder exists: ${templatePath}`);

          const stat = await fs.stat(templatePath);

          if (stat.isDirectory()) {
            ctx.logger.info(`Copying directory: ${templatePath} to ${outputPath}`);
            await copyDirectory(ctx, templatePath, outputPath, values);
          } else {
            //ctx.logger.info(`Copying file: ${templatePath} to ${outputPath}`);
            await copyFile(ctx, templatePath, outputPath, values);
            //await fs.mkdir(path.dirname(outputPath), { recursive: true });
            //await fs.copyFile(templatePath, outputPath);
          }
        } catch (error) {
          ctx.logger.error(`Error processing template for item: ${item.name}, Error: ${error}`);
          throw error;
        }
      }
    },
  });
};

async function copyFile(ctx: any, source: string, destination: string, item: any) {
  
  const processedDestPath = nunjucks.renderString(destination, item);

  // Garantir que o diretório de destino existe antes de escrever o arquivo
  await fs.mkdir(path.dirname(processedDestPath), { recursive: true });

  // Verificando se o arquivo deve ser processado com Nunjucks
  const fileContent = await fs.readFile(source, 'utf-8');
  ctx.logger.info(`Reading File: ${source}`);

  const processedContent = nunjucks.renderString(fileContent, item);

  // Escrevendo o conteúdo processado no destino
  ctx.logger.info(`Writing File: ${processedDestPath}`);
  await fs.writeFile(processedDestPath, processedContent, 'utf-8');
}

async function copyDirectory(ctx: any, source: string, destination: string, item: any) {

  const processedDestPath = nunjucks.renderString(destination, item);

  ctx.logger.info(`Destination Path: ${destination}`);
  ctx.logger.info(`Processed Destination Path: ${processedDestPath}`);

  await fs.mkdir(processedDestPath, { recursive: true });

  const entries = await fs.readdir(source, { withFileTypes: true });
  ctx.logger.info(`Items values: ${JSON.stringify(item)}`);

  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    try {
      if (entry.isDirectory()) {
        await copyDirectory(ctx, srcPath, destPath, item);
      } else {
        await copyFile(ctx, srcPath, destPath, item)
      }
    } catch (error) {
      ctx.logger.error(`Error processing file: ${srcPath} to ${processedDestPath}. Error: ${error}`);
    }
  }
}

