# lerna-script-preset-wix-npm-basic

A preset for wix npm-based repos that exposes following tasks:
 - clean - cleans all modules - `node_modules`, `target`, `*.log`...;
 - test - runs tests for all modules with incremental runs - does not run tests for unchanged modules;
 - pullreq - runs build for modules that have changed since `origin/master`;
 - prepush - syncs `.nvmrc` from root of repo to all modules, module versions, `package.json` docs/repo links, etc.
 - idea - [idea task](../../tasks/idea);

## Usage

Given you have non-lerna project, install needed modules:

```bash
npm install --save-dev lerna lerna-script lerna-script-preset-wix-npm husky
```

init lerna:
```bash
node_modules/.bin/lerna init
```

add to `lerna.json`:
```json
"lerna-script-tasks": "lerna-script-preset-wix-npm-basic"
```

setup your package.json
```json
{
  "name": "aggregator",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "prepush": "lerna-script sync",
    "postinstall": "lerna bootstrap",
    "clean": "lerna-script clean",
    "test": "lerna-script test",
    "idea": "lerna-script idea"
  },
  "devDependencies": {
    "husky": "^0.14.3",
    "lerna": "^2.0.0",
    "lerna-script": "latest",
    "lerna-script-preset-wix-npm-basic": "latest"
  }
}
```

Then:
 - upon install of root module all modules will be bootstrapped;
 - `prepush` task will be executed by `husky` and all sync actions will be performed;
 
If preset *almost* works for you, you can reuse most of it but customize a selected task, like:

```js
const preset = require('lerna-script-preset-wix-npm')();

function clean(log) {
  preset.clean(log).then(() => {
    //do your thing
  });
}

module.exports = {
  ...preset,
  clean
}
```
