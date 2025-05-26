# @javalce/config

[![npm version](https://img.shields.io/npm/v/@javalce/config-cli.svg?style=flat-square&labelColor=000000)](https://www.npmjs.com/package/@javalce/config-cli)
[![license](https://img.shields.io/npm/l/@javalce/config-cli.svg?style=flat-square&labelColor=000000)](https://github.com/javalce/config-cli/blob/main/LICENSE)

CLI for bootstrapping ESLint and Prettier configurations using my custom presets.

## What does this CLI do?

- Generates configuration files for ESLint and Prettier using the [@javalce/eslint-config](https://www.npmjs.com/package/@javalce/eslint-config) and [@javalce/prettier-config](https://www.npmjs.com/package/@javalce/prettier-config) presets.
- Installs the necessary dependencies (optional).
- Allows you to update the recommended VSCode settings.

## Usage

Run the following command at the root of your project:

```sh
pnpm dlx @javalce/config init
```

An interactive wizard will open to help you configure ESLint and/or Prettier according to your needs. You can choose the framework, whether you use TailwindCSS, and other options.
