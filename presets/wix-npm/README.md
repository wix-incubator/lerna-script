# lerna-script-preset-wix-npm

A preset for wix npm-based repos that exposes following tasks:
 - clean - cleans all modules - `node_modules`, `target`, `*.log`...;
 - test - runs tests for all modules with incremental runs - does not run tests for unchanged modules;
 - pullreq - runs build for modules that have changed since `origin/master`;
 - prepush - syncs `.nvmrc` from root of repo to all modules, module versions, `package.json` docs/repo links, etc.
 - idea - [idea task](../../tasks/idea);
 - depcheck - [depcheck](../../tasks/depcheck);
 - deps:extraneous, deps:unmanaged, deps:latest, deps:sync - [depcheck](../../tasks/depcheck); 

## Usage

Given you have non-lerna project, install needed modules:

```bash
npm install --save-dev lerna lerna-script lerna-script-preset-wix-npm husky
```

init lerna:
```bash
node_modules/.bin/lerna init
```

add lerna.js to root of repo like:
```js
module.exports = require('lerna-script-preset-wix-npm');
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
    "ls": "lerna-script",
    "idea": "lerna-script idea"
  },
  "devDependencies": {
    "husky": "^0.14.3",
    "lerna": "^2.0.0",
    "lerna-script": "latest",
    "lerna-script-preset-wix-npm": "latest"
  }
}
```

Then:
 - upon install of root module all modules will be bootstrapped;
 - `prepush` task will be executed by `husky` and all sync actions will be performed;
 - `ls` - run misc preset tasks like `npm run ls deps:latest`.