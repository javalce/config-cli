import type { Config } from '@/types';

import * as p from '@clack/prompts';
import colors from 'ansis';
import fs from 'fs-extra';

import { CSS_PATHS } from '@/constants';

import { formatConfigFile } from './format';
import { isPackageTypeModule } from './npm';

export function getPrettierDependencies({ framework, hasTailwind }: Config): string[] {
  const dependencies: string[] = ['prettier', '@javalce/prettier-config'];
  const isUsingAstro = framework === 'astro';
  const plugins: string[] = [
    ...(isUsingAstro ? ['prettier-plugin-astro'] : []),
    ...(hasTailwind ? ['prettier-plugin-tailwindcss'] : []),
  ];

  dependencies.push(...plugins);

  return dependencies;
}

export async function writePrettierConfig(
  { framework, hasTailwind }: Config,
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
    ...(hasTailwind ? ['prettier-plugin-tailwindcss'] : []),
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
  const typeComment = hasTailwind
    ? `/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */`
    : `/** @type {import('prettier').Config} */`;

  const tailwindStylesheetPath = CSS_PATHS[framework] ?? CSS_PATHS.default;

  const configObj: Record<string, unknown> = {
    plugins,
  };

  if (hasTailwind) {
    configObj.tailwindStylesheet = tailwindStylesheetPath;
  }

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

  const prettierConfig = `
// @ts-check
import prettierConfig from '@javalce/prettier-config';

${typeComment}
export default {
  ...prettierConfig,
  ${stringifiedConfigObject}
};
`.trim();

  const formattedPrettierConfig = await formatConfigFile(prettierConfig);

  if (dryRun) {
    p.note(colors.blue(formattedPrettierConfig));
  } else {
    await fs.writeFile(configFilename, formattedPrettierConfig);
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
