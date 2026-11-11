import type { Agent } from 'package-manager-detector';

import type { PackageManager } from '@/types';

import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import * as p from '@clack/prompts';
import colors from 'ansis';
import { resolveCommand } from 'package-manager-detector/commands';
import { detect } from 'package-manager-detector/detect';
import { x } from 'tinyexec';

import { formatJsonFile } from './format';
import { exitWithError, handleCancellation } from './prompt';

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
    exitWithError('The package.json file was not found');
  }
}

export function isPackageTypeModule(): boolean {
  const packageJson = getPackageJson();

  return packageJson.type === 'module';
}

export async function installDependencies(detectedAgent: Agent, deps: string[]): Promise<void> {
  const resolved = resolveCommand(detectedAgent, 'add', ['-D', ...deps]);

  if (!resolved) {
    exitWithError(`Could not resolve an install command for "${detectedAgent}"`);
  }

  const spinner = p.spinner();

  try {
    spinner.start('Installing missing dependencies...');

    const result = await x(resolved.command, resolved.args, {
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
  } catch (error) {
    spinner.stop(colors.red('Failed to install dependencies'));

    const output = (error as { output?: { stderr?: string; stdout?: string } }).output;
    const details = [output?.stderr, output?.stdout].map((text) => text?.trim()).find(Boolean);

    p.log.message(
      `You can install them manually with:\n  ${resolved.command} ${resolved.args.join(' ')}`,
    );
    exitWithError(
      details ?? (error instanceof Error ? error.message : 'Unknown error while installing'),
    );
  }
}

const SCRIPTS: Record<string, string> = {
  lint: 'eslint',
  'lint:fix': 'eslint --fix',
  format: 'prettier --write .',
  'format:check': 'prettier --check .',
};

export async function updatePackageJson(dryRun: boolean): Promise<void> {
  const packageJson = getPackageJson();
  const existingScripts = (packageJson.scripts ?? {}) as Record<string, unknown>;
  const conflicts = Object.keys(SCRIPTS).filter(
    (name) => name in existingScripts && existingScripts[name] !== SCRIPTS[name],
  );

  let overwrite = true;

  if (conflicts.length > 0) {
    const list = conflicts.map((name) => `  ${name}: ${String(existingScripts[name])}`).join('\n');

    p.log.warn(`These package.json scripts already exist with a different value:\n${list}`);

    if (dryRun) {
      p.log.info('In a real run you would be asked whether to overwrite them; showing them kept.');
      overwrite = false;
    } else {
      const shouldOverwrite = await p.confirm({
        message: 'Overwrite them? (No keeps your current scripts)',
        initialValue: false,
      });

      if (p.isCancel(shouldOverwrite)) handleCancellation();

      overwrite = shouldOverwrite;
    }
  }

  const newScripts = Object.fromEntries(
    Object.entries(SCRIPTS).filter(([name]) => overwrite || !conflicts.includes(name)),
  );

  packageJson.scripts = { ...existingScripts, ...newScripts };

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
    exitWithError('Failed to update package.json');
  }
}
