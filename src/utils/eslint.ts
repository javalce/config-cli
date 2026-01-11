import type { Options } from '@/types';

import * as p from '@clack/prompts';
import colors from 'ansis';
import fs from 'fs-extra';

import { ESLINT_DEPENDENCIES, JSX_REQUIRED_FRAMEWORKS } from '@/constants';

import { formatConfigFile } from './format';
import { isPackageTypeModule } from './npm';

export function getEslintDependencies({ framework, testing }: Options): string[] {
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
  { framework, testing, testingLibrary, lib }: Options,
  dryRun: boolean,
): Promise<void> {
  const isESModule = isPackageTypeModule();
  const configFilename = isESModule ? 'eslint.config.js' : 'eslint.config.mjs';

  const configObj: Record<string, unknown> = {};

  if (JSX_REQUIRED_FRAMEWORKS.includes(framework)) {
    configObj.jsx = {
      a11y: true,
    };
  }

  if (framework === 'next') {
    configObj.react = true;
  }

  if (framework !== 'node') {
    configObj[framework === 'preact' ? 'react' : framework] = true;
  }

  if (testing) {
    configObj.test = {
      framework: testing,
      ...(testingLibrary && { testingLibrary: true }),
    };
  }

  if (lib) {
    configObj.type = 'lib';
  }

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
