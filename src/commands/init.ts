import * as p from '@clack/prompts';
import { Command } from 'commander';
import colors from 'picocolors';

import { getDependencies, getEslintOptions, writeEslintConfig } from '@/utils/eslint';
import { getPackageManager } from '@/utils/npm';
import { handleCancellation } from '@/utils/prompt';

export const init = new Command()
  .name('init')
  .description('Bootstrap ESLint and Prettier configuration')
  .action(async () => {
    p.intro(colors.bgCyan(' Welcome to the ESLint and Prettier configuration wizard! '));

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

    if (shouldConfigureEslint) {
      p.log.step('Configuring ESLint...');

      const eslintOptions = await getEslintOptions();

      deps.push(...getDependencies(eslintOptions));

      p.log.step('Generating ESLint config file...');

      await writeEslintConfig(eslintOptions);
    }

    if (shouldConfigurePrettier) {
      p.log.step('Configuring Prettier...');

      p.log.success(colors.green('Prettier configuration complete!'));
    }

    const shouldInstallDependencies = await p.confirm({
      message: 'Would you like to install the dependencies now?',
      initialValue: true,
    });

    if (p.isCancel(shouldInstallDependencies)) handleCancellation();

    let doneMessage = 'Done! Now run:\n';
    const pkgManager = getPackageManager();

    if (!shouldInstallDependencies) {
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
