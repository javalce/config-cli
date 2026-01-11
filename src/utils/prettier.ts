import type { PrettierOptions } from '@/types';

import * as p from '@clack/prompts';
import colors from 'ansis';
import fs from 'fs-extra';

import { formatConfigFile } from './format';
import { isPackageTypeModule } from './npm';

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
  const isESModule = isPackageTypeModule();
  const configFilename = isESModule ? 'prettier.config.js' : 'prettier.config.mjs';
  const isUsingAstro = framework === 'astro';
  const isUsingSvelte = framework === 'svelte';
  const plugins = [
    '...prettierConfig.plugins',
    ...(isUsingAstro ? ['prettier-plugin-astro'] : []),
    ...(isUsingSvelte ? ['prettier-plugin-svelte'] : []),
    ...(tailwind ? ['prettier-plugin-tailwindcss'] : []),
  ];
  const overrides = [
    ...(isUsingSvelte
      ? [
          {
            files: ['*.svelte'],
            options: {
              parser: 'svelte',
            },
          },
        ]
      : []),
    ...(isUsingAstro
      ? [
          {
            files: ['*.astro'],
            options: {
              parser: 'astro',
            },
          },
        ]
      : []),
  ];
  const typeComment = tailwind
    ? `/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */`
    : `/** @type {import('prettier').Config} */`;

  const stylesheetPaths: Record<string, string> = {
    next: './src/app/globals.css',
    vue: './src/style.css',
    svelte: './src/app.css',
    astro: './src/styles/globals.css',
    default: './src/index.css',
  };
  const tailwindStylesheetPath = stylesheetPaths[framework!] ?? stylesheetPaths.default;

  const configObj: Record<string, unknown> = {};

  if (tailwind) {
    configObj.tailwindStylesheet = tailwindStylesheetPath;
  }

  configObj.plugins = plugins;

  if (overrides.length > 0) {
    configObj.overrides = overrides;
  }

  const stringifiedConfigObject = Object.entries(configObj)
    .map(([key, value]) => {
      let stringifiedValue = JSON.stringify(value, null, 2);

      if (key === 'plugins') {
        stringifiedValue = stringifiedValue.replace(
          /"\.\.\.prettierConfig\.plugins"/,
          '...prettierConfig.plugins',
        );
      }

      return `${key}: ${stringifiedValue},`;
    })
    .join('\n  ');

  const config = `
// @ts-check
import prettierConfig from '@javalce/prettier-config';

${typeComment}
export default {
  ...prettierConfig,
  ${stringifiedConfigObject}
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
