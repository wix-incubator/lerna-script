# lerna-script-tasks-modules

Syncs dependencies/devDependencies/peerDependencies for modules within repo.

## install

```bash
npm install --save-dev lerna-script-tasks-modules
```

## Usage

Say you have modules:

- `/packages/a` with version `1.0.0`
- `/packages/b` with version `1.0.0` and it depends on module `a` where `{dependencies: {"a": "~1.0.0"}}`

and you up the version of `/packages/a` to `2.0.0`. If you want for version of `a` to be in sync in module `b`, then you could do:

```js
//lerna.js
const syncModules = require('lerna-script-tasks-modules');

module.exports['modules:sync'] = syncModules();
```

and then upon executing `lerna-script modules:sync` version of dependency `a` for module `b` will be set to `~2.0.0`.
Same goes for `devDependencies` and `peerDependencies`.

## API

### ({packages: [], transformDependencies: version => version, transformPeerDependencies: version => version})(log): Promise

Returns a function that syncs module versions across repo.

Parameters:

- packages, optional = list of lerna packages. Loads defaults of not provided.
- transformDependencies, optional = function to transform dependencies and devDependencies. Defaults to `version => '~' + version`.
- transformPeerDependencies, optional - function to transform peerDependencies. Defaults to `version => '>=' + version`.
