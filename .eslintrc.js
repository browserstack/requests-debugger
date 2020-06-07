module.exports = {
  "parserOptions": {
    'sourceType': 'script',
    'ecmaVersion': 5
  },
  "env": {
    "node": true,
    "commonjs": true,
    "mocha": true
  },
  "extends": "eslint:recommended",
  "rules": {
    "indent": ["error", 2],
    "linebreak-style": [ "error", "unix"],
    "semi": ["error", "always"]
  },
  "overrides": [{
    "files": ["src/node.js", "src/commandLine.js", "test/**/*.test.js"],
    "rules": {
      "no-console": "off"
    }
  }]
};