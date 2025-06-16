import path from 'node:path';

import * as p from '@clack/prompts';
import colors from 'ansis';
import { execa } from 'execa';
import fs from 'fs-extra';

import { handleCancellation } from './prompt';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

function checkFilesExist(...filenames: string[]): boolean {
  const cwd = process.cwd();

  return filenames.every((filename) => fs.existsSync(path.join(cwd, filename)));
}

export function getPackageManager(): PackageManager {
  const pkg = getPackageJson();
  const packageManager = pkg.packageManager as string | undefined;
  const userAgent = process.env.npm_config_user_agent ?? '';

  const packageManagerEvaluators: Array<{ name: PackageManager; test: () => boolean }> = [
    {
      name: 'pnpm',
      test: () =>
        packageManager?.includes('pnpm') ??
        (checkFilesExist('pnpm-lock.yaml') || userAgent.includes('pnpm')),
    },
    {
      name: 'yarn',
      test: () =>
        packageManager?.includes('yarn') ??
        (checkFilesExist('yarn.lock') || userAgent.includes('yarn')),
    },
    {
      name: 'bun',
      test: () =>
        packageManager?.includes('bun') ??
        (checkFilesExist('bun.lockb', 'bun.lock') || userAgent.includes('bun')),
    },
    {
      name: 'npm',
      test: () => packageManager?.includes('npm') ?? userAgent.includes('npm'),
    },
  ];

  for (const managerEvaluator of packageManagerEvaluators) {
    if (managerEvaluator.test()) return managerEvaluator.name;
  }

  return 'npm';
}

export function getPackageJson(): Record<string, unknown> {
  try {
    const packageJson = fs.readFileSync(path.join(process.cwd(), 'package.json'), {
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
  const packageManager = getPackageManager();

  const spinner = p.spinner();

  try {
    spinner.start('Installing missing dependencies...');
    await execa(packageManager, [packageManager === 'npm' ? 'install' : 'add', '-D', ...deps]);
    spinner.stop(colors.green('Dependencies installed!'));
  } catch {
    spinner.stop(colors.red('Failed to install dependencies'));
    handleCancellation();
  }
}
