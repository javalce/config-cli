import type { Agent } from 'package-manager-detector';

import type { PackageManager } from '@/types';

import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import * as p from '@clack/prompts';
import colors from 'ansis';
import { detect } from 'package-manager-detector/detect';
import { x } from 'tinyexec';

import { formatJsonFile } from './format';
import { handleCancellation } from './prompt';

export async function detectPackageManager(): Promise<{
  detectedAgent: Agent;
  agent: PackageManager;
}> {
  const result = await detect({
    cwd: process.cwd(),
    onUnknown: (packageManager) => {
      console.warn('Unknown package manager', packageManager);

      return undefined;
    },
  });

  const detectedAgent = result?.agent ?? 'npm';
  const [agent] = detectedAgent.split('@');

  return { detectedAgent, agent: agent as PackageManager };
}

export function getPackageJson(): Record<string, unknown> {
  try {
    const packageJson = readFileSync(path.join(process.cwd(), 'package.json'), {
      encoding: 'utf-8',
    });

    return JSON.parse(packageJson) as Record<string, unknown>;
  } catch {
    p.log.error('The package.json file was not found');
    handleCancellation();
  }
}

export function isPackageTypeModule(): boolean {
  const packageJson = getPackageJson();

  return packageJson.type === 'module';
}

export async function installDependencies(deps: string[]): Promise<void> {
  const { agent } = await detectPackageManager();

  const spinner = p.spinner();

  try {
    spinner.start('Installing missing dependencies...');

    const result = await x(agent, [agent === 'yarn' ? 'add' : 'install', '-D', ...deps], {
      nodeOptions: {
        stdio: 'pipe',
        cwd: process.cwd(),
        env: {
          ...process.env,
          FORCE_COLOR: '1',
        },
      },
      throwOnError: true,
    });

    spinner.stop(colors.green('Dependencies installed!'));
    p.log.message(result.stdout);
  } catch {
    spinner.stop(colors.red('Failed to install dependencies'));
    handleCancellation();
  }
}

export async function updatePackageJson(dryRun: boolean): Promise<void> {
  const packageJson = getPackageJson();

  packageJson.scripts = {
    ...(packageJson.scripts ?? {}),
    lint: 'eslint',
    'lint:fix': 'eslint --fix',
    format: 'prettier --write .',
    'format:check': 'prettier --check .',
  };

  const formattedPackageJson = await formatJsonFile(JSON.stringify(packageJson));

  if (dryRun) {
    p.log.info('Updated package.json:');
    p.note(colors.blue(formattedPackageJson));

    return;
  }

  try {
    await writeFile(path.join(process.cwd(), 'package.json'), formattedPackageJson, {
      encoding: 'utf-8',
    });
  } catch {
    p.log.error('Failed to update package.json');
    handleCancellation();
  }
}
