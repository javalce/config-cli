// @ts-check

/** @type {import('lint-staged').Configuration} */
export default {
  '**/*.{js,ts}': ['eslint --fix', 'prettier --write'],
  '**/*.{json,md,yml,yaml}': ['prettier --write'],
};
