# lerna-script-tasks-idea [![npm](https://img.shields.io/npm/v/lerna-script-tasks-idea.svg)](https://www.npmjs.com/package/lerna-script-tasks-idea)

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

## ()
Returns a function that generates [WebStorm](https://www.jetbrains.com/webstorm/) for all modules in repo.
