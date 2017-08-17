# lerna-script [![Build Status](https://img.shields.io/travis/wix/lerna-script/master.svg?label=build%20status)](https://travis-ci.org/wix/lerna-script)

**Experimental** - it's not near ready - and can still be abandoned - use at your own risk!

[Lerna](https://lernajs.io/) is a nice tool to manage JavaScript projects with multiple packages, but sometimes you need 
more than it provides. Fret not - [lerna-script](https://www.npmjs.com/package/lerna-script) to the rescue. It allows 
you to add custom tasks/scripts to automate multiple package management routine tasks. Some use cases:
 - normalize `package.json`s of all modules (ex. fix repo url, docs url) on pre-push/pre-commit;
 - generate [WebStorm](https://www.jetbrains.com/webstorm/) project for all modules in repo;
 - sync dependencies across all modules - ex. to have same version of mocha;
 - have composite tasks (install, run n scripts) to ease maintenance for large teams/OSS projects.
 - regenerate readme's for root readme and all modules that are using ex. [markdown-magic](https://github.com/DavidWells/markdown-magic);
 - whatever else you need.
 
 # Install 
 
 ```bash
npm install --save-dev lerna-script
```

# Usage

  - [Basic usage example](#basic-usage-example)
  - [Incremental builds](#incremental-builds)
  - [Presets](#presets)
  - [Git hooks](#git-hooks)

## Basic usage example

Add `lerna-script` launcher to `package.json` scripts:

```json
{
  "scripts": {
    "start": "lerna-script"
  }
}
```

To start using, add `lerna.js` to root of your mono-repo and add initial task:

```js
const {packages, iter, exec} = require('lerna-script'),
  {join} = require('path');

module.exports.syncNvmRc = () => {
  const rootNvmRcPath = join(process.cwd(), '.nvmrc'); 
  
  return iter.parallel(packages(), lernaPackage => {
    exec(lernaPackage)(`cp ${rootNvmRcPath} .`);
  });
}
```

And then you can run it:

```bash
npm start syncNvmRc
```

What happened here:
 - you created `lerna.js` where each export is a task referenced by export name you can execute via `lerna-script [export]`;
 - you used functions from `lerna-script` which are just thin wrappers around [lerna api](https://github.com/lerna/lerna/tree/master/src);
 - you created task to sync root `.nvmrc` to all modules so that all of them have same node version defined.

You could also fallback to [lerna api](https://github.com/lerna/lerna/tree/master/src) and write same task as:

```js
const Repository = require('lerna/lib/Repository'),
  PackageUtilities = require('lerna/lib/PackageUtilities'),
  {join} = require('path'),
  {execSync} = require('child_process');

module.exports.syncNvmRc = () => {
  const rootNvmRcPath = join(process.cwd(), '.nvmrc');
  
  return PackageUtilities.getPackages(new Repository()).forEach(lernaPackage => {
    execSync(`cp ${rootNvmRcPath}`, {cwd: lernaPackage.location});
  });
}
```

To see available function please check-out [lerna-script](./lerna-script), for pre-cooked tasks check-out [presets](./presets).

## Incremental builds

[Lerna](https://lernajs.io/) provides a way to run commands (bootstrap, npm scripts, exec) either for all modules or a sub-tree based on git 
diff from a ref (master, tag, commit), but does not provide a way to run actions incrementally. One use case would be to
run tests for all modules, once one of the modules fail, fix it an continue, so you don't have to rerun tests for modules
that already passed. Or do a change and run tests for a subtree that might be impacted by a change given module dependency
graph.

For this [lerna-script](./lerna-script) provides means to both mark modules as built and filter-out already built modules:

```js
const {packages, iter, exec, changes, filters} = require('lerna-script');

module.exports.test = () => {
  // filters.removeBuilt removes packages that did not change since last run
  const changedPackages = filters.removeBuilt(packages());
  
  return iter.forEach(changedPackages, lernaPackage => { 
    return exec.script('test')(lernaPackage)
      .then(() => changes.markBuilt(lernaPackage)) //mark package as built once `npm test` script passes.
  });
}
```

## Presets

[lerna-script](.) has some presets or otherwise pre-assembled tasks/task-sets for solving some problem. Examples:
 - [idea](./presets/idea) - to generate [WebStorm](https://www.jetbrains.com/webstorm/) project for all modules in repo;
 - TBD [npm-links](./presets/npm-links) - to fix repo, docs, etc. links for all modules matching their git path;
 - ...

## Git hooks

Sometimes there are things you want to make sure are done/enforced on your modules like:
 - linting all modules in repo;
 - making sure some meta is normalized automatically across all modules;
 - ...

Recommendation is to combine [lerna-script](https://www.npmjs.com/package/lerna-script) with [husky](https://www.npmjs.com/package/husky) for running automatic actions on pre-push/pre-commit hooks. Then you don't have to think about it and it just happens automatically.

Say you want to make sure that [repository](https://docs.npmjs.com/files/package.json#repository) url is valid for all modules and you don't leave it out when adding new module (via amazing copy/paste pattern).

For that you could add a [lerna-script](https://www.npmjs.com/package/lerna-script) task to normalize [repository](https://docs.npmjs.com/files/package.json#repository) and hook-it up to [pre-push git hook](https://git-scm.com/book/gr/v2/Customizing-Git-Git-Hooks).

First install husky:

```bash
npm install --save-dev husky
```

then add script to `package.json`

```js
{
  "scripts": {
    "prepush": "lerna-script update-repo-urls",
  }
}
```

and add export to `lerna.js`:

```js
const {packages, iter, exec, changes, filters} = require('lerna-script');
const {readFileSync, writeFileSync} = require('fs');
const {join, relative} = require('path');

module.exports['update-repo-urls'] = () => {
  const baseUrl = 'https://github.com/module';

  return iter.forEach(packages(), lernaPackage => {
    const packageJsonPath = join(lernaPackage.location, 'package.json');
    const relativeModulePath = relative(process.cwd(), lernaPackage.location);
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
    writeFileSync(packageJsonPath, JSON.stringify(Object.assign({}, packageJson, {
      homepage: `${baseUrl}/tree/master/${relativeModulePath}`
    }));
  });
}
```

**Note:** Example is a bit contrived - you should do read/write in async way, could use `parallel` instead of `forEach`, but you got the point:)
