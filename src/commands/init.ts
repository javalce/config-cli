import type { Framework } from '@/types';

import * as p from '@clack/prompts';
import colors from 'ansis';
import { Command } from 'commander';
import * as z from 'zod';

import { confirmTailwindIntegration, detectOptions } from '@/utils/detect';
import { getEslintDependencies, writeEslintConfig } from '@/utils/eslint';
import { getPackageManager, installDependencies } from '@/utils/npm';
import {
  getPrettierDependencies,
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
  .option('-d, --dry-run', 'Show what will be done without making any changes')
  .action(async (opts) => {
    const { dryRun } = await optionsSchema.parseAsync(opts);
    const pkgManager = getPackageManager();

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
      p.log.step(colors.bgBlue(' Configuring ESLint... '));

      const eslintOptions = await detectOptions();

      framework = eslintOptions.framework;

      deps.push(...getEslintDependencies(eslintOptions));

      await writeEslintConfig(eslintOptions, dryRun);
    }

    if (shouldConfigurePrettier) {
      p.log.step(colors.bgBlue(' Configuring Prettier... '));

      isUsingTailwind = confirmTailwindIntegration();

      deps.push(...getPrettierDependencies({ tailwind: isUsingTailwind, framework }));

      await writePrettierConfig({ tailwind: isUsingTailwind, framework }, dryRun);
      await writePrettierignore(dryRun);
    }

    let showInstallMessage = false;

    p.log.info('The following dependencies are required:');
    p.log.message(colors.cyan(deps.join(' ')));

    if (!dryRun) {
      const shouldInstallDependencies = await p.confirm({
        message: 'Would you like to install them now?',
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
      await updateVscodeSettings(pkgManager, { tailwind: isUsingTailwind, framework }, dryRun);
    }

    let doneMessage = 'Done! Now run:\n';

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
