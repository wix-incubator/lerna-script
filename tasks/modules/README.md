# octopus-start-preset-modules [![npm](https://img.shields.io/npm/v/npm.svg)](https://www.npmjs.com/package/octopus-start-preset-modules)

## install

```bash
npm install --save-dev octopus-start-preset-modules
```

## Usage

```js
const {sync, where, list} = require('octopus-start-preset-modules'),
  Start = require('start');

const start = new Start();

module.exports['modules:sync'] = start(sync());
module.exports['modules:where'] = start(where());
module.exports['modules:list'] = start(list());
```

## API

### sync(mutateVersion: version => version)
Returns a function that you can bind to `exports` and that will sync modules across multi-module repo. Syncing modules means:
 - if you have module `a` with version `1.0.0` and another module `b` depends on it, but depends on different version (ex. `~1.0.1`), then modules `b` dependencies will be updated to match that of module `a` declared version.
 
Parameters:
 - mutateVersion - if you want ex. version to be synced to some special semver expression(~) you can do `version => `^${version}``. Defaults to `version => `~${version}`` 
 
### list()
Returns a function that you can bind to `exports` and that will simply print discovered modules.

### where()
Returns a function that you can bind to `exports` and that will simply print discovered modules.
