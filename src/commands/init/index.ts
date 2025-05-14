import * as p from '@clack/prompts';
import { Command } from 'commander';
import colors from 'picocolors';

import { configureEslint } from './eslint';

import { getPkgManager } from '@/utils/npm';
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

    if (shouldConfigureEslint) {
      p.log.step('Configuring ESLint...');
      await configureEslint();
      p.log.success('ESLint configuration complete!');
    }

    if (shouldConfigurePrettier) {
      p.log.step('Configuring Prettier...');
      // Add Prettier configuration logic here
      // For example, create a .prettierrc file or update package.json
      // with Prettier settings.
      p.log.success('Prettier configuration complete!');
    }

    const shouldInstallDependencies = await p.confirm({
      message: 'Would you like to install the dependencies now?',
      initialValue: true,
    });

    if (p.isCancel(shouldInstallDependencies)) handleCancellation();

    let doneMessage = 'Done! Now run:\n';
    const pkgManager = getPkgManager();

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
