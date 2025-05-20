import type { PrettierOptions } from '@/types';

import * as p from '@clack/prompts';
import colors from 'ansis';
import fs from 'fs-extra';

import { isPackageTypeModule } from './npm';
import { handleCancellation } from './prompt';

export async function getPrettierOptions(): Promise<PrettierOptions> {
  const tailwind = await p.confirm({
    message: 'Are you using Tailwind CSS?',
    initialValue: true,
  });

  if (p.isCancel(tailwind)) handleCancellation();

  return {
    tailwind,
  };
}

export async function writePrettierConfig(
  { tailwind }: PrettierOptions,
  dryRun: boolean,
): Promise<void> {
  const isESModule = await isPackageTypeModule();
  const configFilename = isESModule ? 'prettier.config.js' : 'prettier.config.mjs';
  const configLines: string[] = [];

  if (tailwind) {
    configLines.push("plugins: ['prettier-plugin-tailwindcss'],");
  }

  const configContent = configLines.map((line) => `  ${line}`).join('\n');
  const config = `
import  { defineConfig } from '@javalce/prettier-config';

export default defineConfig({
${configContent}
});`.trimStart();

  if (dryRun) {
    p.note(colors.blue(config));
  } else {
    await fs.writeFile(configFilename, config);
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
