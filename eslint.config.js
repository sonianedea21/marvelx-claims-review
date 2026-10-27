import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

// "Tokens only" (CLAUDE.md hard rule 5), enforced instead of trusted: no arbitrary
// Tailwind values like p-[13px] or text-[#333], no hex colours and no inline styles in src/.
const ARBITRARY_VALUE = '/(^|[\\s:])-?[a-z][a-z0-9-]*-\\[/';
const HEX_COLOUR = '/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b/';
const TOKEN_MESSAGE = 'Use a design token from src/tokens/tokens.css. If the value is missing, add a token first.';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '.screenshots', 'fixtures', 'fixtures-extra'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // A leading underscore marks a value that is deliberately unused, e.g. one left out of a spread.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Hooks: called in the same order every render, and effects list everything they read.
    // Missing effect dependencies (stale closures) are a bug coding agents write often.
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: `Literal[value=${ARBITRARY_VALUE}]`, message: `No arbitrary Tailwind values. ${TOKEN_MESSAGE}` },
        { selector: `TemplateElement[value.raw=${ARBITRARY_VALUE}]`, message: `No arbitrary Tailwind values. ${TOKEN_MESSAGE}` },
        { selector: `Literal[value=${HEX_COLOUR}]`, message: `No hex colours outside tokens.css. ${TOKEN_MESSAGE}` },
        { selector: "JSXAttribute[name.name='style']", message: `No inline styles. ${TOKEN_MESSAGE}` },
      ],
    },
  },
);
