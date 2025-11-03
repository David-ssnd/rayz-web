import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next", "prettier"),
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
    parserOptions: {
      babelOptions: {
        presets: [require.resolve('next/babel')],
      },
    },
  }
];

export default eslintConfig;
