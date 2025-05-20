import prettier, { type Options } from 'prettier';

const prettierOptions: Options = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  endOfLine: 'lf',
  trailingComma: 'all',
  semi: true,
  singleQuote: true,
  jsxSingleQuote: true,
  bracketSpacing: true,
  arrowParens: 'always',
};

export async function formatConfigFile(config: string): Promise<string> {
  return prettier.format(config, {
    ...prettierOptions,
    parser: 'espree',
  });
}
