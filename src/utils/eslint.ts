import type { Config } from '@/types';

import { writeFile } from 'node:fs/promises';

import * as p from '@clack/prompts';
import colors from 'ansis';

import {
  ESLINT_DEPENDENCIES,
  JSX_REQUIRED_FRAMEWORKS,
  TANSTACK_QUERY_ESLINT_PLUGIN,
  TANSTACK_QUERY_FRAMEWORKS,
  TANSTACK_ROUTER_ESLINT_PLUGIN,
} from '@/constants';

import { isTanstackRouterAvailable } from './detect';
import { formatConfigFile } from './format';
import { isPackageTypeModule } from './npm';

export function getEslintDependencies({
  framework,
  testingFramework,
  hasTestingLibrary,
  hasTanstackQuery,
  hasTanstackRouter,
}: Config): string[] {
  const deps = new Set(['eslint', '@javalce/eslint-config']);

  if (framework === 'next' || framework === 'tanstack') {
    ESLINT_DEPENDENCIES.react.forEach((dep) => deps.add(dep));
  }

  if (hasTanstackRouter && isTanstackRouterAvailable(framework)) {
    deps.add(TANSTACK_ROUTER_ESLINT_PLUGIN);
  }

  if (hasTanstackQuery && TANSTACK_QUERY_FRAMEWORKS.includes(framework)) {
    deps.add(TANSTACK_QUERY_ESLINT_PLUGIN);
  }

  ESLINT_DEPENDENCIES[framework].forEach((dep) => deps.add(dep));

  if (testingFramework) {
    ESLINT_DEPENDENCIES[testingFramework].forEach((dep) => deps.add(dep));
  }

  if (hasTestingLibrary && ['react', 'next', 'tanstack', 'vue'].includes(framework)) {
    ESLINT_DEPENDENCIES['testing-library'].forEach((dep) => deps.add(dep));
  }

  return [...deps];
}

export async function writeEslintConfig(
  { framework, testingFramework, hasTestingLibrary, hasTanstackQuery, hasTanstackRouter }: Config,
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

  if (framework === 'tanstack') {
    configObj.react = true;
  } else if (framework !== 'node') {
    configObj[framework === 'preact' ? 'react' : framework] = true;
  }

  const useQuery = hasTanstackQuery && TANSTACK_QUERY_FRAMEWORKS.includes(framework);

  const useRouter = hasTanstackRouter && isTanstackRouterAvailable(framework);

  if (useRouter || useQuery) {
    configObj.tanstack = {
      ...(useRouter && { router: true }),
      ...(useQuery && { query: true }),
    };
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
