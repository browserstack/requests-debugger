module.exports = {
  "parserOptions": {
    'sourceType': 'script',
    'ecmaVersion': 5
  },
  "env": {
    "node": true,
    "commonjs": true,
    "mocha": true,
  },
  "globals": {
    "Promise": true
  },
  "extends": "eslint:recommended",
  "rules": {
    "indent": ["error", 2],
    "linebreak-style": [ "error", "unix"],
    "semi": ["error", "always"],
    "eol-last": ["error", "always"],
    "keyword-spacing": [1],
    "no-trailing-spaces": ["error", { "skipBlankLines": true }]
  },
  "overrides": [{
    "files": ["src/requestsDebugger.js", "src/commandLine.js", "test/**/*.test.js"],
    "rules": {
      "no-console": "off"
    }
  }]
};
