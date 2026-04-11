import type { Config } from '@/types';

import { writeFile } from 'node:fs/promises';

import * as p from '@clack/prompts';
import colors from 'ansis';

import { ESLINT_DEPENDENCIES, JSX_REQUIRED_FRAMEWORKS } from '@/constants';

import { formatConfigFile } from './format';
import { isPackageTypeModule } from './npm';

export function getEslintDependencies({
  framework,
  testingFramework,
  hasTestingLibrary,
}: Config): string[] {
  const deps = new Set(['eslint', '@javalce/eslint-config']);

  if (framework === 'next') {
    ESLINT_DEPENDENCIES.react.forEach((dep) => deps.add(dep));
  }

  ESLINT_DEPENDENCIES[framework].forEach((dep) => deps.add(dep));

  if (testingFramework) {
    ESLINT_DEPENDENCIES[testingFramework].forEach((dep) => deps.add(dep));
  }

  if (hasTestingLibrary && ['react', 'next', 'vue'].includes(framework)) {
    ESLINT_DEPENDENCIES['testing-library'].forEach((dep) => deps.add(dep));
  }

  return [...deps];
}

export async function writeEslintConfig(
  { framework, testingFramework, hasTestingLibrary }: Config,
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

  if (testingFramework) {
    configObj.test = {
      runner: testingFramework,
      ...(hasTestingLibrary && { testingLibrary: true }),
    };
  }

  const eslintConfig = `
// @ts-check
import { defineConfig } from '@javalce/eslint-config';

export default defineConfig(${Object.keys(configObj).length ? JSON.stringify(configObj, null, 2) : ''});
`.trimStart();

  const formattedEslintConfig = await formatConfigFile(eslintConfig);

  if (dryRun) {
    p.note(colors.blue(formattedEslintConfig));
  } else {
    await writeFile(configFilename, formattedEslintConfig);
  }

  p.log.success(colors.green(`Created ${configFilename}`));
}
