import type { EslintOptions, Framework, TestingFramework } from '@/types';

import * as p from '@clack/prompts';
import fs from 'fs-extra';
import colors from 'picocolors';

import { DEPENDENCIES_MAP, FRAMEWORK_OPTIONS, TESTING_FRAMEWORK_OPTIONS } from '@/consts';
import { handleCancellation } from '@/utils/prompt';

import { isPackageTypeModule } from './npm';

export async function getEslintOptions(): Promise<EslintOptions> {
  const shouldAddFramework = await p.confirm({
    message: 'Are you using a framework?',
    initialValue: true,
  });

  if (p.isCancel(shouldAddFramework)) handleCancellation();

  let framework: Framework | null = null;

  if (shouldAddFramework) {
    const selectedFramework = await p.select<Framework>({
      message: 'Select a framework',
      options: FRAMEWORK_OPTIONS.map(({ label, value, color }) => ({
        label: color(label),
        value,
      })),
    });

    if (p.isCancel(selectedFramework)) handleCancellation();

    framework = selectedFramework;
  }

  const shouldAddTesting = await p.confirm({
    message: 'Do you want to add a testing framework?',
    initialValue: false,
  });

  if (p.isCancel(shouldAddTesting)) handleCancellation();
  let testing: TestingFramework | null = null;

  if (shouldAddTesting) {
    const selectedFramework = await p.select({
      message: 'Select a testing framework',
      options: TESTING_FRAMEWORK_OPTIONS.map(({ label, value, color }) => ({
        label: color(label),
        value,
      })),
    });

    if (p.isCancel(selectedFramework)) handleCancellation();
    testing = selectedFramework;
  }
  const lib = await p.confirm({
    message: 'Is this a library?',
    initialValue: false,
  });

  if (p.isCancel(lib)) handleCancellation();

  return {
    framework,
    testing,
    lib,
  };
}

export function getDependencies({ framework, testing }: EslintOptions): string[] {
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

export async function writeEslintConfig({ framework, testing, lib }: EslintOptions): Promise<void> {
  const isESModule = await isPackageTypeModule();
  const configFilename = isESModule ? 'eslint.config.js' : 'eslint.config.mjs';

  const configLines: string[] = [];

  const hasTsEslinConfig = await fs.exists('tsconfig.eslint.json');
  const hasTsAppConfig = await fs.exists('tsconfig.app.json');
  const hasTsNodeConfig = await fs.exists('tsconfig.node.json');

  if (!hasTsEslinConfig && hasTsAppConfig && hasTsNodeConfig) {
    configLines.push("typescript: ['tsconfig.node.json', 'tsconfig.app.json'],");
  }

  if (framework) {
    if (framework === 'next') {
      configLines.push('react: true,');
    }

    configLines.push(`${framework}: true,`);
  }

  if (testing) {
    configLines.push(`testing: ${testing},`);
  }

  if (lib) {
    configLines.push(`type: 'lib',`);
  }

  const configContent = configLines.map((line) => `  ${line}`).join('\n');
  const config = `
import { defineConfig } from '@javalce/eslint-config';

export default defineConfig({
${configContent}
});`.trimStart();

  await fs.writeFile(configFilename, config);

  p.log.success(colors.green(`Created ${configFilename}`));
}
