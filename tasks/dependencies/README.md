# lerna-script-tasks-dependencies

[lerna-script](../..) tasks for managing dependency versions across lerna repo.

## install

```bash
npm install --save-dev lerna-script-tasks-dependencies
```

## Usage

TBD

```js
const {extraneous, unmanaged, sync, latest} = require('lerna-script-tasks-dependencies')

module.exports['deps:sync'] = sync()
module.exports['deps:extraneous'] = extraneous()
module.exports['deps:unmanaged'] = unmanaged()
module.exports['deps:latest'] = latest()
```

## API

### sync({[packages]})(log): Promise

Task that syncs dependency versions (dependencies, devDependencies, peerDependencies) with those defined in `lerna.json` as `managed*Dependencies`.

Parameters:

* packages - custom package list, or defaults as defined by `lerna.json`
* log - `npmlog` instance passed-in by `lerna-script`;

Say you have `lerna.json` in root of your project like:

```json
{
  "managedDependencies": {
    "lodash": "~1.0.0"
  }
}
```

upon invocation of this task for all submodules that have `lodash` defined in `dependencies` or `devDependencies` version of `lodash` will be updated to `~1.0.0`.

### unmanaged({[packages]})(log): Promise

List dependencies, that are present in modules `dependencies`, `devDependencies`, `peerDependencies`, but not defined in `lerna.json` as `managed*Dependencies`.

Parameters:

* packages - custom package list, or defaults as defined by `lerna.json`
* log - `npmlog` instance passed-in by `lerna-script`;

### extraneous({[packages]})(log): Promise

List dependencies, that are present in `lerna.json` as `managed*Dependencies`, but not defined in modules `dependencies`, `devDependencies`, `peerDependencies`.

Parameters:

* packages - custom package list, or defaults as defined by `lerna.json`
* log - `npmlog` instance passed-in by `lerna-script`;

### latest({[addRange]})(log): Promise

List dependencies, that are present in `lerna.json` as `managed*Dependencies` and needs updating based on latest version published in npmjs.org.

Parameters:

* addRange - when updating version in `lerna.json` to add range operator ('~', '^', ...). By default it sets fixed version.
* log - `npmlog` instance passed-in by `lerna-script`;
