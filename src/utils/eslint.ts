import type { EslintOptions } from '@/types';

import * as p from '@clack/prompts';
import colors from 'ansis';
import fs from 'fs-extra';

import { DEPENDENCIES_MAP, FRAMEWORK_OPTIONS, TESTING_FRAMEWORK_OPTIONS } from '@/constants';

import { formatConfigFile } from './format';
import { isPackageTypeModule } from './npm';
import { handleCancellation } from './prompt';

export async function getEslintOptions(): Promise<EslintOptions> {
  const framework = await p.select({
    message: 'Select a framework',
    options: FRAMEWORK_OPTIONS.map(({ label, value, color }) => ({
      label: color(label),
      value,
    })),
  });

  if (p.isCancel(framework)) handleCancellation();

  const testing = await p.select({
    message: 'Select a testing framework',
    options: TESTING_FRAMEWORK_OPTIONS.map(({ label, value, color }) => ({
      label: color(label),
      value,
    })),
  });

  if (p.isCancel(testing)) handleCancellation();

  const testingLibrary = await (async () => {
    if (framework === null || !['angular', 'react', 'vue', 'svelte'].includes(framework)) {
      return false;
    }

    const result = await p.confirm({
      message: 'Are you using a testing library?',
      initialValue: false,
    });

    if (p.isCancel(result)) handleCancellation();

    return result;
  })();

  const lib = await p.confirm({
    message: 'Are you building a library?',
    initialValue: false,
  });

  if (p.isCancel(lib)) handleCancellation();

  return {
    framework,
    testingLibrary,
    testing,
    lib,
  };
}

export function getEslintDependencies({
  framework,
  testing,
  testingLibrary,
}: EslintOptions): string[] {
  const deps = new Set(['eslint', '@javalce/eslint-config']);

  if (framework === 'next') {
    DEPENDENCIES_MAP.react.forEach((dep) => deps.add(dep));
  }
  DEPENDENCIES_MAP[framework].forEach((dep) => deps.add(dep));

  if (testing) {
    DEPENDENCIES_MAP[testing].forEach((dep) => deps.add(dep));
    if (['react', 'next', 'vue'].includes(framework)) {
      DEPENDENCIES_MAP['testing-library'].forEach((dep) => deps.add(dep));
    }
  }

  return [...deps];
}

export async function writeEslintConfig(
  { framework, testing, testingLibrary, lib }: EslintOptions,
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

  if (framework === 'next') {
    configObj.react = true;
  }
  configObj[framework] = true;

  if (testing) {
    configObj.test = {
      framework: testing,
      ...(testingLibrary && { testingLibrary: true }),
    };
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
