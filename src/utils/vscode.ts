import path from 'node:path';

import * as p from '@clack/prompts';
import colors from 'ansis';
import fs from 'fs-extra';

import type { PrettierOptions } from '@/types';

import { formatJsonFile } from './format';

function buildSettings({ tailwind, framework }: PrettierOptions): Record<string, unknown> {
  const settings: Record<string, unknown> = {
    'editor.formatOnSave': true,
    'editor.defaultFormatter': 'esbenp.prettier-vscode',
    'editor.codeActionsOnSave': {
      'source.fixAll.eslint': 'explicit',
      'source.organizeImports': 'explicit',
    },
    'eslint.validate': ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'],
    'explorer.fileNesting.enabled': true,
    'explorer.fileNesting.expand': false,
    'explorer.fileNesting.patterns': {
      'tsconfig.json': 'tsconfig.*.json',
      'package.json':
        'package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb, .gitignore, *.config.js, *.config.mjs, *.config.ts, .editorconfig, .prettierignore, .node-version, .npmrc',
    },
  };

  if (framework === 'astro') {
    (settings['eslint.validate'] as string[]).push('astro');
  }

  if (tailwind) {
    settings['files.associations'] = { '*.css': 'tailwindcss' };
  }

  return settings;
}

export async function updateVscodeSettings(
  options: PrettierOptions,
  dryRun: boolean,
): Promise<void> {
  const cwd = process.cwd();
  const vscodeDirPath = path.join(cwd, '.vscode');
  const settingsFilePath = path.join(vscodeDirPath, 'settings.json');

  await fs.ensureDir(vscodeDirPath);

  const newSettings = buildSettings(options);
  const newSettingsContent = JSON.stringify(newSettings);

  let formattedSettingsContent: string;

  if (!fs.existsSync(settingsFilePath)) {
    formattedSettingsContent = await formatJsonFile(newSettingsContent);
  } else {
    const existingSettingsContent = await fs.readFile(settingsFilePath, 'utf-8');
    const existingSettings = JSON.parse(existingSettingsContent) as Record<string, unknown>;
    let mergedSettings = { ...existingSettings, ...newSettings };

    mergedSettings = Object.keys(mergedSettings)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = mergedSettings[key];

        return acc;
      }, {});

    formattedSettingsContent = await formatJsonFile(JSON.stringify(mergedSettings));
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

  await fs.writeFile(settingsFilePath, formattedSettingsContent);

  p.log.success(colors.green('Updated .vscode/settings.json'));
}
