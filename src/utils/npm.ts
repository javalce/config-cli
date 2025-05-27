import path from 'node:path';

import * as p from '@clack/prompts';
import colors from 'ansis';
import { execa } from 'execa';
import fs from 'fs-extra';

import { handleCancellation } from './prompt';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

export function getPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent ?? '';

  if (userAgent.startsWith('yarn')) {
    return 'yarn';
  }

  if (userAgent.startsWith('pnpm')) {
    return 'pnpm';
  }

  if (userAgent.startsWith('bun')) {
    return 'bun';
  }

  return 'npm';
}

export async function getPackageJson(): Promise<Record<string, unknown>> {
  try {
    const packageJson = await fs.readFile(path.join(process.cwd(), 'package.json'), {
      encoding: 'utf-8',
    });

    return JSON.parse(packageJson) as Record<string, unknown>;
  } catch {
    p.log.error('The package.json file was not found');
    handleCancellation();
  }
}

export async function isPackageTypeModule(): Promise<boolean> {
  const packageJson = await getPackageJson();

  return packageJson.type === 'module';
}

export async function installDependencies(deps: string[]): Promise<void> {
  const packageManager = getPackageManager();
  const spinner = p.spinner();

  try {
    spinner.start('Installing missing dependencies...');
    await execa(packageManager, [packageManager === 'npm' ? 'install' : 'add', '-D', ...deps]);
    spinner.stop(colors.green('Dependencies installed'));
  } catch {
    spinner.stop(colors.red('Failed to install dependencies'));
    handleCancellation();
  }
}
