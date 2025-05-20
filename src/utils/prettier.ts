import type { PrettierOptions } from '@/types';

import * as p from '@clack/prompts';
import colors from 'ansis';
import fs from 'fs-extra';
import prettier from 'prettier';

import { isPackageTypeModule } from './npm';
import { handleCancellation } from './prompt';

export async function getPrettierOptions(astro: boolean): Promise<PrettierOptions> {
  const tailwind = await p.confirm({
    message: 'Are you using Tailwind CSS?',
    initialValue: true,
  });

  if (p.isCancel(tailwind)) handleCancellation();

  return {
    tailwind,
    astro,
  };
}

export async function writePrettierConfig(
  { tailwind, astro }: PrettierOptions,
  dryRun: boolean,
): Promise<void> {
  const isESModule = await isPackageTypeModule();
  const configFilename = isESModule ? 'prettier.config.mjs' : 'prettier.config.js';
  const plugins: string[] = [
    ...(astro ? ['prettier-plugin-astro'] : []),
    ...(tailwind ? ['prettier-plugin-tailwindcss'] : []),
  ];

  let configContent = '';

  if (plugins.length > 0) {
    configContent += `plugins: [${plugins.map((p) => `'${p}'`).join(', ')}],\n`;
  }

  if (astro) {
    configContent += `overrides: [
  {
    files: ['*.astro'],
    options: { parser: 'astro' },
  }
],\n`;
  }

  const config = `
import { defineConfig } from '@javalce/prettier-config';

export default defineConfig({
${configContent}
});
`.trim();

  const formattedConfig = await prettier.format(config, {
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    endOfLine: 'lf',
    trailingComma: 'all',
    semi: true,
    singleQuote: true,
    jsxSingleQuote: true,
    bracketSpacing: true,
    arrowParens: 'always',
    parser: 'espree',
  });

  if (dryRun) {
    p.note(colors.blue(formattedConfig));
  } else {
    await fs.writeFile(configFilename, formattedConfig);
  }
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
  p.log.success(colors.green('Prettier ignore file created!'));
}
