import path from 'node:path';

import * as p from '@clack/prompts';
import colors from 'ansis';
import { execa } from 'execa';
import fs from 'fs-extra';

import { handleCancellation } from './prompt';

const PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'] as const;

type PackageManager = (typeof PACKAGE_MANAGERS)[number];

function getPackageManagerFromPackageJson(): PackageManager | undefined {
  const pkg = getPackageJson();
  const packageManager = pkg.packageManager as string | undefined;

  return PACKAGE_MANAGERS.find((pm) => packageManager?.startsWith(pm));
}

function getPackageManagerFromLockfiles(): PackageManager | undefined {
  const lockfiles = {
    'bun.lock': 'bun',
    'bun.lockb': 'bun',
    'pnpm-lock.yaml': 'pnpm',
    'yarn.lock': 'yarn',
    'package-lock.json': 'npm',
  };

  for (const [lockfile, manager] of Object.entries(lockfiles)) {
    const file = path.join(process.cwd(), lockfile);

    if (fs.existsSync(file)) {
      return manager as PackageManager;
    }
  }

  return undefined;
}

function getPackageManagerFromUserAgent(): PackageManager | undefined {
  const userAgent = process.env.npm_config_user_agent ?? '';

  if (userAgent.includes('pnpm')) return 'pnpm';
  if (userAgent.includes('yarn')) return 'yarn';
  if (userAgent.includes('bun')) return 'bun';
  if (userAgent.includes('npm')) return 'npm';

  return undefined;
}

export function getPackageManager(): PackageManager {
  const pmFromPackageJson = getPackageManagerFromPackageJson();

  if (pmFromPackageJson) return pmFromPackageJson;

  const pmFromLockfiles = getPackageManagerFromLockfiles();

  if (pmFromLockfiles) return pmFromLockfiles;

  const pmFromUserAgent = getPackageManagerFromUserAgent();

  if (pmFromUserAgent) return pmFromUserAgent;

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
