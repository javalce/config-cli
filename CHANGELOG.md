# Changelog

# [0.3.0](https://github.com/javalce/config-cli/compare/v0.2.3...v0.3.0) (2026-11-11)

### Bug Fixes

- merge VSCode settings with existing user config ([9d3d889](https://github.com/javalce/config-cli/commit/9d3d8890f322f116b3001345150d544aeafc0895))
- remove '@solidjs/testing-library' from TESTING_LIBRARY_DEPENDENCIES ([b8b1497](https://github.com/javalce/config-cli/commit/b8b14977c4fa1afb1806e768353fb8d7342a131d))
- update exit codes for SIGINT and SIGTERM signals ([1661a0f](https://github.com/javalce/config-cli/commit/1661a0faac13e68d082f80759757453f2e3a7a4f))
- update package manager detection and installation process ([001731b](https://github.com/javalce/config-cli/commit/001731b046fec5d0efceba03fb778bddf28f98c5))

### Features

- add TanStack Start, Router and Query support ([534e2c3](https://github.com/javalce/config-cli/commit/534e2c367b9e64339d4c26967e41775060a79753))

## [0.2.3](https://github.com/javalce/config-cli/compare/v0.2.2...v0.2.3) (2026-09-10)

### Bug Fixes

- move simple-git-hooks from dependencies to devDependencies in package.json ([b4c7cd6](https://github.com/javalce/config-cli/commit/b4c7cd6de8d4a3ae8d36022db64dae859dc9f1bc))
- update repository URL format and adjust bin path in package.json ([0835ca2](https://github.com/javalce/config-cli/commit/0835ca2e9bcfe178ed666881d80a8ae72cb69b30))

## [0.2.2](https://github.com/javalce/config-cli/compare/v0.2.1...v0.2.2) (2026-08-12)

## [0.2.1](https://github.com/javalce/config-cli/compare/v0.2.0...v0.2.1) (2026-04-26)

### Bug Fixes

- await result in installDependencies and log output ([a8ef4df](https://github.com/javalce/config-cli/commit/a8ef4df2e630cac63a687b3fa49150ca4de1f430))

# [0.2.0](https://github.com/javalce/config-cli/compare/v0.1.1...v0.2.0) (2026-04-11)

### Bug Fixes

- exclude 'node' from FRAMEWORK_DEPENDENCIES type in constants and detection logic ([ccf2df1](https://github.com/javalce/config-cli/commit/ccf2df13388ce63af05ab9269fb9b7d644cf9def))
- specify eslint version in getEslintDependencies function ([b9cdc89](https://github.com/javalce/config-cli/commit/b9cdc89719693e25e1913261079942130fa82865))
- specify version for @eslint-react/eslint-plugin ([e919fa9](https://github.com/javalce/config-cli/commit/e919fa9cd583a0d2cd8ef08fb251b2cdf81ca982))
- update installDependencies to handle bun package manager ([dd5f029](https://github.com/javalce/config-cli/commit/dd5f0296177427de8f7d14f89ec9e98033cb2763))

### Features

- add Angular support in Prettier configuration ([c517ba1](https://github.com/javalce/config-cli/commit/c517ba184f622e86f9be7ca18d6d7a44c69b262f))
- enhance init command with automatic and manual config ([f01828e](https://github.com/javalce/config-cli/commit/f01828e8c8f40f9c4b973409bb183579aa9e36cc))
- integrate package-manager-detector for improved package manager detection ([235a81c](https://github.com/javalce/config-cli/commit/235a81cff7f0e9d947edef2c8901b0ae68893a47))
