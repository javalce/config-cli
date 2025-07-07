import type { EslintOptions } from '@/types';

import * as p from '@clack/prompts';
import colors from 'ansis';
import fs from 'fs-extra';

import { DEPENDENCIES_MAP, FRAMEWORK_OPTIONS, TESTING_FRAMEWORK_OPTIONS } from '@/consts';

import { formatConfigFile } from './format';
import { isPackageTypeModule } from './npm';
import { handleCancellation } from './prompt';

export async function getEslintOptions(): Promise<EslintOptions> {
  return p.group(
    {
      framework: () =>
        p.select({
          message: 'Select a framework',
          options: FRAMEWORK_OPTIONS.map(({ label, value, color }) => ({
            label: color(label),
            value,
          })),
        }),
      testing: () =>
        p.select({
          message: 'Select a testing framework',
          options: TESTING_FRAMEWORK_OPTIONS.map(({ label, value, color }) => ({
            label: color(label),
            value,
          })),
        }),
      lib: () =>
        p.confirm({
          message: 'Are you building a library?',
          initialValue: false,
        }),
    },
    {
      onCancel: handleCancellation,
    },
  );
}

export function getEslintDependencies({ framework, testing }: EslintOptions): string[] {
  const deps = new Set(['eslint', '@javalce/eslint-config']);

  if (framework) {
    if (framework === 'next') {
      DEPENDENCIES_MAP.react.forEach((dep) => deps.add(dep));
    }
    DEPENDENCIES_MAP[framework].forEach((dep) => deps.add(dep));
  }

  if (testing) {
    DEPENDENCIES_MAP[testing].forEach((dep) => deps.add(dep));
    if (framework && ['react', 'next', 'vue'].includes(framework)) {
      DEPENDENCIES_MAP['testing-library'].forEach((dep) => deps.add(dep));
    }
  }

  return [...deps];
}

export async function writeEslintConfig(
  { framework, testing, lib }: EslintOptions,
  dryRun: boolean,
): Promise<void> {
  const isESModule = isPackageTypeModule();
  const configFilename = isESModule ? 'eslint.config.js' : 'eslint.config.mjs';

  const hasTsEslinConfig = await fs.exists('tsconfig.eslint.json');
  const hasTsAppConfig = await fs.exists('tsconfig.app.json');
  const hasTsNodeConfig = await fs.exists('tsconfig.node.json');

  // Construir el objeto de configuración dinámicamente
  const configObj: Record<string, unknown> = {};

  if (!hasTsEslinConfig && hasTsAppConfig && hasTsNodeConfig) {
    configObj.typescript = ['tsconfig.node.json', 'tsconfig.app.json'];
  }

  if (framework) {
    if (framework === 'next') {
      configObj.react = true;
    }
    configObj[framework] = true;
  }

  if (testing) {
    configObj.testing = testing;
  }

  if (lib) {
    configObj.type = 'lib';
  }

  // Generar el contenido del archivo de configuración
  const config = `
// @ts-check
import { defineConfig } from '@javalce/eslint-config';

export default defineConfig(${Object.keys(configObj).length ? JSON.stringify(configObj, null, 2) : ''});
`.trimStart();

  const formattedConfig = await formatConfigFile(config);

  if (dryRun) {
    p.note(colors.blue(formattedConfig));
  } else {
    await fs.writeFile(configFilename, formattedConfig);
  }

  p.log.success(colors.green(`Created ${configFilename}`));
}
