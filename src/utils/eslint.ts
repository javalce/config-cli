import type { EslintOptions, Framework, TestingFramework } from '@/types';

import * as p from '@clack/prompts';
import colors from 'ansis';
import fs from 'fs-extra';
import { isPackageExists } from 'local-pkg';

import {
  ESLINT_DEPENDENCIES,
  FRAMEWORK_DEPENDENCIES,
  TESTING_FRAMEWORK_DEPENDENCIES,
  TESTING_LIBRARY_DEPENDENCIES,
} from '@/constants';

import { formatConfigFile } from './format';
import { isPackageTypeModule } from './npm';
import { handleCancellation } from './prompt';

export async function getEslintOptions(): Promise<EslintOptions> {
  const framework =
    (Object.keys(FRAMEWORK_DEPENDENCIES) as Framework[]).find((key) =>
      FRAMEWORK_DEPENDENCIES[key].every((dep) => isPackageExists(dep)),
    ) ?? 'node';

  p.log.info(`Detected framework: ${colors.cyan(framework)}`);

  const testing =
    (Object.keys(TESTING_FRAMEWORK_DEPENDENCIES) as TestingFramework[]).find((key) =>
      TESTING_FRAMEWORK_DEPENDENCIES[key].every((dep) => isPackageExists(dep)),
    ) ?? null;

  p.log.info(`Detected testing framework: ${colors.cyan(testing ?? 'none')}`);

  const testingLibrary = TESTING_LIBRARY_DEPENDENCIES.some((dep) => isPackageExists(dep));

  p.log.info(`Detected testing library: ${colors.cyan(testingLibrary ? 'yes' : 'no')}`);

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

export function getEslintDependencies({ framework, testing }: EslintOptions): string[] {
  const deps = new Set(['eslint', '@javalce/eslint-config']);

  if (framework === 'next') {
    ESLINT_DEPENDENCIES.react.forEach((dep) => deps.add(dep));
  }
  ESLINT_DEPENDENCIES[framework].forEach((dep) => deps.add(dep));

  if (testing) {
    ESLINT_DEPENDENCIES[testing].forEach((dep) => deps.add(dep));
    if (['react', 'next', 'vue'].includes(framework)) {
      ESLINT_DEPENDENCIES['testing-library'].forEach((dep) => deps.add(dep));
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
