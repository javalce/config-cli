import type { ParseError } from 'jsonc-parser';

import type { Config, PackageManager } from '@/types';

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import * as p from '@clack/prompts';
import colors from 'ansis';
import { applyEdits, modify, parse } from 'jsonc-parser';

import { formatJsonFile } from './format';

function buildSettings(
  { framework, hasTailwind }: Config,
  packageManager: PackageManager,
): Record<string, unknown> {
  let pkgNesting = `.gitignore, *.config.js, *.config.mjs, *.config.ts, .editorconfig, .prettierignore, .node-version`;

  if (packageManager === 'npm') {
    pkgNesting = `package-lock.json, ${pkgNesting}`;
  } else if (packageManager === 'yarn') {
    pkgNesting = `yarn.lock, ${pkgNesting}`;
  } else if (packageManager === 'pnpm') {
    pkgNesting = `pnpm-lock.yaml, pnpm-workspace.yaml, ${pkgNesting}`;
  } else {
    pkgNesting = `bun.lockb, bun.lock, ${pkgNesting}`;
  }

  const settings: Record<string, unknown> = {
    'editor.codeActionsOnSave': {
      'source.addMissingImports.ts': 'explicit',
      'source.fixAll.eslint': 'explicit',
      'source.organizeImports': 'never',
      'source.removeUnusedImports': 'explicit',
    },
    'editor.defaultFormatter': 'esbenp.prettier-vscode',
    'editor.formatOnSave': true,
    'eslint.validate': ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'],
    'explorer.fileNesting.enabled': true,
    'explorer.fileNesting.expand': false,
    'explorer.fileNesting.patterns': {
      'package.json': pkgNesting,
    },
  };

  if (framework === 'svelte') {
    (settings['eslint.validate'] as string[]).push('svelte');
  }

  if (framework === 'astro') {
    (settings['eslint.validate'] as string[]).push('astro');
  }

  if (hasTailwind) {
    settings['files.associations'] = { '*.css': 'tailwindcss' };
  }

  return settings;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeSettings(existing: unknown, incoming: unknown): unknown {
  if (isPlainObject(existing) && isPlainObject(incoming)) {
    const merged: Record<string, unknown> = { ...existing };

    for (const [key, value] of Object.entries(incoming)) {
      merged[key] = key in existing ? mergeSettings(existing[key], value) : value;
    }

    return merged;
  }

  if (Array.isArray(existing) && Array.isArray(incoming)) {
    return [...new Set<unknown>([...(existing as unknown[]), ...(incoming as unknown[])])];
  }

  return incoming;
}

function mergeSettingsContent(
  existingContent: string,
  newSettings: Record<string, unknown>,
): string {
  const errors: ParseError[] = [];
  const existing = parse(existingContent, errors, { allowTrailingComma: true }) as unknown;

  if (errors.length > 0 || (existing !== undefined && !isPlainObject(existing))) {
    throw new Error('Could not parse .vscode/settings.json');
  }

  const current = isPlainObject(existing) ? existing : {};
  let content = existingContent.trim() === '' ? '{}' : existingContent;

  for (const [key, value] of Object.entries(newSettings)) {
    const edits = modify(content, [key], mergeSettings(current[key], value), {
      formattingOptions: { insertSpaces: true, tabSize: 2, eol: '\n' },
    });

    content = applyEdits(content, edits);
  }

  return content.endsWith('\n') ? content : `${content}\n`;
}

export async function updateVscodeSettings(
  packageManager: PackageManager,
  config: Config,
  dryRun: boolean,
): Promise<void> {
  const cwd = process.cwd();
  const vscodeDirPath = path.join(cwd, '.vscode');
  const settingsFilePath = path.join(vscodeDirPath, 'settings.json');

  if (!existsSync(vscodeDirPath)) {
    if (!dryRun) {
      await mkdir(vscodeDirPath, { recursive: true });
    }
  }

  const newSettings = buildSettings(config, packageManager);

  let formattedSettingsContent: string;

  if (!existsSync(settingsFilePath)) {
    formattedSettingsContent = await formatJsonFile(JSON.stringify(newSettings));
  } else {
    const existingSettingsContent = await readFile(settingsFilePath, 'utf-8');

    try {
      formattedSettingsContent = mergeSettingsContent(existingSettingsContent, newSettings);
    } catch {
      p.log.error(
        'Could not parse .vscode/settings.json. Fix its syntax and run the command again; it was left untouched.',
      );

      return;
    }
  }

  if (dryRun) {
    // Format the settings content for better readability
    const lines = formattedSettingsContent.split('\n');
    const pkgIdx = lines.findIndex((line) => line.includes('"package.json"'));
    const newLocal = '*.config.js,';
    const pkgLine = lines[pkgIdx];
    const splitIdx = pkgLine.indexOf(newLocal) + newLocal.length;

    if (splitIdx > newLocal.length - 1) {
      lines[pkgIdx] = pkgLine.slice(0, splitIdx);
      lines.splice(pkgIdx + 1, 0, `      ${pkgLine.slice(splitIdx)}`);
      formattedSettingsContent = lines.join('\n');
    }

    p.note(colors.blue(formattedSettingsContent));

    return;
  }

  await writeFile(settingsFilePath, formattedSettingsContent);

  p.log.success(colors.green('Updated .vscode/settings.json'));
}
