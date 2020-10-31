# lerna-script-tasks-idea

[lerna-script](../../lerna-script) task to generate [WebStorm](https://www.jetbrains.com/webstorm/) project for a [Lerna](https://lernajs.io/) managed project with hardcoded conventions:

- mark `node_modules` as ignored so [WebStorm](https://www.jetbrains.com/webstorm/) would not index those. Having >= 20 modules open with `node_modules` indexing pretty much kills it:/
- set source level to `es6`;
- mark `lib`, `src` as source rootps and `test`, `tests` as test roots;
- add [mocha](https://mochajs.org/) run configurations for all modules.

**Note:** given this task generates [WebStorm](https://www.jetbrains.com/webstorm/) project files manually, you must close all instances of [WebStorm](https://www.jetbrains.com/webstorm/) before generating and open afterwards.

## install

```bash
npm install --save-dev lerna-script-tasks-idea
```

## Usage

Add `lerna-script` launcher to `package.json` scripts:

```json
{
  "scripts": {
    "start": "lerna-script"
  }
}
```

Add export to `lerna.js`:

```js
const idea = require('lerna-script-tasks-idea');

module.exports.idea = idea();
```

To generate [WebStorm](https://www.jetbrains.com/webstorm/) project run:

```bash
npm start idea
```

# API

## ({[packages], mochaConfigurations: packageJson => [], excludePatterns, addRoot: boolean = false})(log): Promise

Returns a function that generates [WebStorm](https://www.jetbrains.com/webstorm/) for all modules in repo.

Parameters:

- packages - list of packages to generate idea project for or defaults to ones defined in `lerna.json`;
- mochaConfigurations - function, that, given packageJson object of a module returns a list of mocha configurations in a format:
  - name - configuration name;
  - environmentVariables - key/value pair of environment variables for configuration;
  - extraOptions - extra mocha options;
  - testKind - kind of test, ex. PATTERN;
  - testPattern - pattern expression.
- excludePatterns - array of patterns that will be set as the project exclude patterns. Files\Folders matching that pattern will be marked as "excluded" in Idea
- addRoot - when true, the `root.iml` file will be generated to make all non-modules visible in IDEA (_optional, defaults to false_)
- log - `npmlog` instance.
