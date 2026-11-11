import type { Config } from '@/types';

import * as p from '@clack/prompts';
import colors from 'ansis';
import { Command } from 'commander';
import * as z from 'zod';

import { NORMALIZED_NAMES, TANSTACK_QUERY_FRAMEWORKS } from '@/constants';
import {
  detectFrameworks,
  detectTailwind,
  detectTanstackQuery,
  detectTanstackRouter,
  detectTestingFramework,
  detectTestingLibrary,
  isTanstackRouterAvailable,
} from '@/utils/detect';
import { writeEditorConfigFile } from '@/utils/editorconfig';
import { getEslintDependencies, writeEslintConfig } from '@/utils/eslint';
import { detectPackageManager, installDependencies, updatePackageJson } from '@/utils/npm';
import {
  getPrettierDependencies,
  writePrettierConfig,
  writePrettierignore,
} from '@/utils/prettier';
import {
  handleCancellation,
  selectExtras,
  selectFramework,
  selectNextOrTanstack,
  selectTestingFramework,
} from '@/utils/prompt';
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
    const { agent, detectedAgent } = await detectPackageManager();

    p.intro(colors.bgCyan(' Welcome to the ESLint and Prettier configuration wizard! '));

    if (dryRun) {
      p.log.warn(colors.bold.yellow('Dry run mode enabled.'));
      p.log.message(
        colors.bold.yellow(
          'During this run, no files will be modified nor dependencies installed.\nYou will see what would be done if you run the command without this flag.',
        ),
      );
    }

    const detectedFrameworks = detectFrameworks();
    const framework =
      detectedFrameworks.includes('next') && detectedFrameworks.includes('tanstack')
        ? await selectNextOrTanstack()
        : detectedFrameworks[0];

    const config: Config = {
      framework,
      testingFramework: detectTestingFramework(),
      hasTestingLibrary: detectTestingLibrary(),
      hasTailwind: detectTailwind(),
      hasTanstackQuery: detectTanstackQuery(),
      hasTanstackRouter: detectTanstackRouter(),
    };
    let finalConfig = buildFinalConfig(config);

    p.log.info(colors.cyan(formatConfig('Detected configuration:', finalConfig)));

    const shouldUseConfiguration = await p.confirm({
      message: 'Do you want to use this configuration?',
      initialValue: true,
    });

    if (p.isCancel(shouldUseConfiguration)) handleCancellation();

    if (!shouldUseConfiguration) {
      const framework = await selectFramework(config);
      const testingFramework = await selectTestingFramework({ ...config, framework });
      const extras = await selectExtras({ ...config, framework, testingFramework });

      finalConfig = buildFinalConfig(config, {
        framework,
        testingFramework,
        ...extras,
      });

      p.log.info(colors.cyan(formatConfig('Configuration:', finalConfig)));

      const confirmConfig = await p.confirm({
        message: 'Continue with this configuration?',
        initialValue: true,
      });

      if (p.isCancel(confirmConfig)) handleCancellation();

      if (!confirmConfig) {
        p.cancel('Configuration aborted.');

        return;
      }
    }

    const deps = [...getEslintDependencies(finalConfig), ...getPrettierDependencies(finalConfig)];

    await writeEslintConfig(finalConfig, dryRun);
    await writePrettierConfig(finalConfig, dryRun);
    await writePrettierignore(dryRun);

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
        await installDependencies(detectedAgent, deps);
      } else {
        showInstallMessage = true;
      }
    }

    await updatePackageJson(dryRun);

    await writeEditorConfigFile(dryRun);

    const shouldUpdateVscodeSettings = await p.confirm({
      message: 'Would you like to update your VSCode settings?',
      initialValue: true,
    });

    if (p.isCancel(shouldUpdateVscodeSettings)) handleCancellation();
    if (shouldUpdateVscodeSettings) {
      await updateVscodeSettings(agent, finalConfig, dryRun);
    }

    let doneMessage = 'Done! Your configuration is complete.';

    if (showInstallMessage) {
      doneMessage += '\nTo install the required dependencies, run:';
      doneMessage += `\n  ${agent} install`;
    }

    p.outro(doneMessage);
  });

function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No';
}

function formatConfig(
  header: string,
  {
    framework,
    testingFramework,
    hasTailwind,
    hasTestingLibrary,
    hasTanstackQuery,
    hasTanstackRouter,
  }: Config,
): string {
  const routerLabel = framework === 'tanstack' ? 'Yes (required)' : yesNo(hasTanstackRouter);
  const messages = [
    `- Framework: ${NORMALIZED_NAMES[framework]}`,
    testingFramework && `- Testing: ${NORMALIZED_NAMES[testingFramework]}`,
    `- Tailwind CSS: ${yesNo(hasTailwind)}`,
    `- Testing Library: ${yesNo(hasTestingLibrary)}`,
    isTanstackRouterAvailable(framework) && `- TanStack Router: ${routerLabel}`,
    TANSTACK_QUERY_FRAMEWORKS.includes(framework) && `- TanStack Query: ${yesNo(hasTanstackQuery)}`,
  ].filter(Boolean);

  return [header, ...messages].join('\n');
}

function buildFinalConfig(config: Config, overrides: Partial<Config> = {}): Config {
  const merged = { ...config, ...overrides };

  return {
    ...merged,
    hasTanstackRouter:
      merged.framework === 'tanstack' ||
      (isTanstackRouterAvailable(merged.framework) && merged.hasTanstackRouter),
  };
}
