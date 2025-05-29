import type { Framework, PrettierOptions } from '@/types';

import * as p from '@clack/prompts';
import colors from 'ansis';
import fs from 'fs-extra';

import { formatConfigFile } from './format';
import { isPackageTypeModule } from './npm';
import { handleCancellation } from './prompt';

export async function getPrettierOptions(framework: Framework | null): Promise<PrettierOptions> {
  const tailwind = await p.confirm({
    message: 'Are you using Tailwind CSS?',
    initialValue: true,
  });

  if (p.isCancel(tailwind)) handleCancellation();

  return {
    tailwind,
    framework,
  };
}

export function getPrettierDependencies({ tailwind, framework }: PrettierOptions): string[] {
  const dependencies: string[] = ['prettier', '@javalce/prettier-config'];
  const isUsingAstro = framework === 'astro';
  const plugins: string[] = [
    ...(isUsingAstro ? ['prettier-plugin-astro'] : []),
    ...(tailwind ? ['prettier-plugin-tailwindcss'] : []),
  ];

  dependencies.push(...plugins);

  return dependencies;
}

export async function writePrettierConfig(
  { tailwind, framework }: PrettierOptions,
  dryRun: boolean,
): Promise<void> {
  const isESModule = await isPackageTypeModule();
  const configFilename = isESModule ? 'prettier.config.js' : 'prettier.config.mjs';
  const isUsingAstro = framework === 'astro';
  const plugins = [
    ...(isUsingAstro ? ['prettier-plugin-astro'] : []),
    ...(tailwind ? ['prettier-plugin-tailwindcss'] : []),
  ];
  const typeComment = tailwind
    ? `/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */`
    : `/** @type {import('prettier').Config} */`;

  // Mapeo de rutas de hojas de estilos para Tailwind
  const stylesheetPaths: Record<string, string> = {
    next: './src/app/globals.css',
    vue: './src/style.css',
    svelte: './src/app.css',
    astro: './src/styles/globals.css',
    default: './src/index.css',
  };
  const tailwindStylesheetPath = stylesheetPaths[framework!] ?? stylesheetPaths.default;

  let configContent = '';

  if (plugins.length > 0) {
    configContent += `plugins: [...prettierConfig.plugins, ${plugins.map((p) => `'${p}'`).join(', ')}],\n`;
  }

  if (tailwind) {
    configContent += `tailwindStylesheet: '${tailwindStylesheetPath}',\n`;
  }

  if (isUsingAstro) {
    configContent += `overrides: [
  {
    files: ['*.astro'],
    options: {
      parser: 'astro'
    },
  }
],`;
  }

  const config = `
// @ts-check

import prettierConfig from '@javalce/prettier-config';

${typeComment}
export default {
  ...prettierConfig,
  ${configContent}
};
`.trim();

  const formattedConfig = await formatConfigFile(config);

  if (dryRun) {
    p.note(colors.blue(formattedConfig));
  } else {
    await fs.writeFile(configFilename, formattedConfig);
  }

  p.log.success(colors.green(`Created ${configFilename}`));
}

export async function writePrettierignore(dryRun: boolean): Promise<void> {
  const ignoreContent = `
package-lock.json
yarn.lock
pnpm-lock.yaml
bun.lock
`.trimStart();
  const ignoreFilename = '.prettierignore';
  const ignoreExists = await fs.exists(ignoreFilename);

  if (ignoreExists) {
    p.log.warn(colors.yellow(`${ignoreFilename} already exists. Skipping...`));

    return;
  }
  if (dryRun) {
    p.note(colors.blue(ignoreContent));
  } else {
    await fs.writeFile(ignoreFilename, ignoreContent);
  }

  p.log.success(colors.green(`Created ${ignoreFilename}`));
}
