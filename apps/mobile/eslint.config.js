// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    rules: {
      "import/no-unresolved": "off",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    ignores: ["dist/*"],
  }
]);
