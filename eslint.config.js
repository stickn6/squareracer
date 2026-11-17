import globals from 'globals';

/* Catches the mistakes that matter after moving code between modules: a missing import (no-undef)
   or a leftover one (no-unused-vars). Style is not enforced. */
export default [
  { ignores: ['dist/', 'node_modules/'] },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      'no-dupe-keys': 'error',
      'no-unreachable': 'error'
    }
  }
];
