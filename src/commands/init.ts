import type { Framework } from '@/types';

import * as p from '@clack/prompts';
import colors from 'ansis';
import { Command } from 'commander';
import { z } from 'zod';

import { getEslintDependencies, getEslintOptions, writeEslintConfig } from '@/utils/eslint';
import { getPackageManager, installDependencies } from '@/utils/npm';
import {
  getPrettierDependencies,
  getPrettierOptions,
  writePrettierConfig,
  writePrettierignore,
} from '@/utils/prettier';
import { handleCancellation } from '@/utils/prompt';
import { updateVscodeSettings } from '@/utils/vscode';

const optionsSchema = z.object({
  dryRun: z.boolean().default(false),
});

export const init = new Command()
  .name('init')
  .description('Bootstrap ESLint and Prettier configuration')
  .option('--dry-run', 'Show what will be done without making any changes')
  .action(async (opts) => {
    const { dryRun } = await optionsSchema.parseAsync(opts);

    p.intro(colors.bgCyan(' Welcome to the ESLint and Prettier configuration wizard! '));

    if (dryRun) {
      p.log.warn(colors.bold.yellow('Dry run mode enabled.'));
      p.log.message(
        colors.bold.yellow(
          'During this run, no files will be modified nor dependencies installed.\nYou will see what would be done if you run the command without this flag.',
        ),
      );
    }

    const selectedTools = await p.select({
      message: 'Select the tools you want to configure',
      options: [
        { label: 'ESLint + Prettier', value: 'eslint-prettier' },
        { label: 'ESLint', value: 'eslint' },
        { label: 'Prettier', value: 'prettier' },
      ],
      initialValue: 'eslint-prettier',
    });

    if (p.isCancel(selectedTools)) handleCancellation();

    const shouldConfigureEslint = selectedTools === 'eslint-prettier' || selectedTools === 'eslint';
    const shouldConfigurePrettier =
      selectedTools === 'eslint-prettier' || selectedTools === 'prettier';

    const deps: string[] = [];
    let isUsingTailwind = false;
    let framework: Framework | null = null;

    if (shouldConfigureEslint) {
      p.log.step('Configuring ESLint...');

      const eslintOptions = await getEslintOptions();

      framework = eslintOptions.framework;

      deps.push(...getEslintDependencies(eslintOptions));

      p.log.step('Generating ESLint config file...');

      await writeEslintConfig(eslintOptions, dryRun);
    }

    if (shouldConfigurePrettier) {
      p.log.step('Configuring Prettier...');

      const prettierOptions = await getPrettierOptions(framework);

      isUsingTailwind = prettierOptions.tailwind;

      deps.push(...getPrettierDependencies(prettierOptions));

      p.log.step('Generating Prettier config files...');

      await writePrettierConfig(prettierOptions, dryRun);
      await writePrettierignore(dryRun);

      p.log.success(colors.green('Prettier configuration complete!'));
    }

    let showInstallMessage = false;

    p.log.info('The following dependencies are required:');
    p.log.message(colors.cyan(deps.join(', ')));

    if (!dryRun) {
      const shouldInstallDependencies = await p.confirm({
        message: 'Would you like to install the dependencies now?',
        initialValue: true,
      });

      if (p.isCancel(shouldInstallDependencies)) handleCancellation();

      if (shouldInstallDependencies) {
        await installDependencies(deps);
      } else {
        showInstallMessage = true;
      }
    }

    const shouldUpdateVscodeSettings = await p.confirm({
      message: 'Would you like to update your VSCode settings?',
      initialValue: true,
    });

    if (p.isCancel(shouldUpdateVscodeSettings)) handleCancellation();
    if (shouldUpdateVscodeSettings) {
      await updateVscodeSettings({ tailwind: isUsingTailwind, framework }, dryRun);
    }

    let doneMessage = 'Done! Now run:\n';
    const pkgManager = getPackageManager();

    if (showInstallMessage) {
      doneMessage += `\n  ${pkgManager} install`;
    }

    if (shouldConfigureEslint) {
      doneMessage += `\n  ${pkgManager} lint`;
    }

    if (shouldConfigurePrettier) {
      doneMessage += `\n  ${pkgManager} format`;
    }

    p.outro(doneMessage);
  });
