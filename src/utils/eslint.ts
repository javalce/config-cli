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
  const deps = new Set<string>(['eslint', '@javalce/eslint-config']);
  let addTestingLibrary = false;

  if (framework === 'next') {
    DEPENDENCIES_MAP.react.forEach((dep) => deps.add(dep));
  }

  if (framework) {
    DEPENDENCIES_MAP[framework].forEach((dep) => deps.add(dep));
    if (['react', 'next', 'vue'].includes(framework)) {
      addTestingLibrary = true;
    }
  }

  if (testing) {
    DEPENDENCIES_MAP[testing].forEach((dep) => deps.add(dep));
  }

  if (addTestingLibrary) {
    DEPENDENCIES_MAP['testing-library'].forEach((dep) => deps.add(dep));
  }

  return Array.from(deps);
}

export async function writeEslintConfig(
  { framework, testing, lib }: EslintOptions,
  dryRun: boolean,
): Promise<void> {
  const isESModule = await isPackageTypeModule();
  const configFilename = isESModule ? 'eslint.config.js' : 'eslint.config.mjs';

  let configContent = '';

  const hasTsEslinConfig = await fs.exists('tsconfig.eslint.json');
  const hasTsAppConfig = await fs.exists('tsconfig.app.json');
  const hasTsNodeConfig = await fs.exists('tsconfig.node.json');

  if (!hasTsEslinConfig && hasTsAppConfig && hasTsNodeConfig) {
    configContent += "typescript: ['tsconfig.node.json', 'tsconfig.app.json'],";
  }

  if (framework) {
    if (framework === 'next') {
      configContent += 'react: true,';
    }

    configContent += `${framework}: true,`;
  }

  if (testing) {
    configContent += `testing: ${testing},`;
  }

  if (lib) {
    configContent += `type: 'lib',`;
  }

  const config = `
import { defineConfig } from '@javalce/eslint-config';

export default defineConfig({
${configContent}
});`.trimStart();

  const formattedConfig = await formatConfigFile(config);

  if (dryRun) {
    p.note(colors.blue(formattedConfig));
  } else {
    await fs.writeFile(configFilename, formattedConfig);
  }

  p.log.success(colors.green(`Created ${configFilename}`));
}
