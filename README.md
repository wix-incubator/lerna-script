# lerna-script [![Build Status](https://img.shields.io/travis/wix/lerna-script/master.svg?label=build%20status)](https://travis-ci.org/wix/lerna-script) [![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

[Lerna](https://lernajs.io/) is a nice tool to manage JavaScript projects with multiple packages, but sometimes you need
more than it provides. [lerna-script](https://www.npmjs.com/package/lerna-script) might be just the thing you need. It allows
you to add custom tasks/scripts to automate multiple package management routine tasks. Some use cases:

- normalize `package.json`s of all modules (ex. fix repo url, docs url) on pre-push/pre-commit;
- generate [WebStorm](https://www.jetbrains.com/webstorm/) project for all modules in repo;
- sync dependencies across all modules - ex. to have same version of mocha;
- have composite tasks (install, run npm scripts) to ease maintenance for large teams/OSS projects.
- regenerate readme's for root readme and all modules that are using ex. [markdown-magic](https://github.com/DavidWells/markdown-magic);
- whatever else you need.

# Install

```bash
npm install --save-dev lerna-script
```

# Usage

- [Basic usage example](#basic-usage-example)
- [Incremental builds](#incremental-builds)
- [Tasks](#tasks)
- [Git hooks](#git-hooks)
- [External presets](#external-presets)

## Basic usage example

Add `lerna-script` launcher to `package.json` scripts:

```json
{
  "scripts": {
    "ls": "lerna-script"
  }
}
```

To start using, add `lerna.js` to root of your mono-repo and add initial task:

```js
const {loadPackages, iter, exec} = require('lerna-script'),
  {join} = require('path')

async function syncNvmRc(log) {
  log.info('syncNvmRc', 'syncing .nvmrc to all modules from root')
  const packages = await loadPackages()

  return iter.parallel(packages)(lernaPackage => {
    exec.command(lernaPackage)(`cp ${join(process.cwd(), '.nvmrc')} .`)
  })
}

module.exports.syncNvmRc = syncNvmRc
```

And then you can run it:

```bash
npm run ls syncNvmRc
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
  {execSync} = require('child_process')

module.exports.syncNvmRc = () => {
  const rootNvmRcPath = join(process.cwd(), '.nvmrc')

  return PackageUtilities.getPackages(new Repository()).forEach(lernaPackage => {
    execSync(`cp ${rootNvmRcPath}`, {cwd: lernaPackage.location})
  })
}
```

To see available function please check-out [lerna-script](./lerna-script), for pre-cooked tasks check-out [tasks](./tasks).

## Incremental builds

[Lerna](https://lernajs.io/) provides a way to run commands (bootstrap, npm scripts, exec) either for all modules or a sub-tree based on git
diff from a ref (master, tag, commit), but does not provide a way to run actions incrementally. One use case would be to
run tests for all modules, once one of the modules fail, fix it an continue, so you don't have to rerun tests for modules
that already passed. Or do a change and run tests for a subtree that might be impacted by a change given module dependency
graph.

For this [lerna-script](./lerna-script) provides means to both mark modules as built and filter-out already built modules:

```js
const {loadPackages, iter, exec, changes, filters} = require('lerna-script')

module.exports.test = log => {
  return iter.forEach(changedPackages, {log, build: 'test'})(lernaPackage => {
    return exec.script(lernaPackage)('test')
  })
}
```

where property `build` on `forEach` marks processed package as built with label `test`. For different tasks you can have separate labels so they do not clash.

## Tasks

[lerna-script](.) has some pre-assembled tasks/task-sets for solving some problem. Examples:

- [idea](./tasks/idea) - to generate [WebStorm](https://www.jetbrains.com/webstorm/) project for all modules in repo;
- [npmfix](./tasks/npmfix) - to fix repo, docs links for all modules matching their git path;
- [modules](./tasks/modules) - to align module versions across repo;
- [depcheck](./tasks/depcheck) - to run [depcheck](https://github.com/depcheck/depcheck) for all modules in repo;
- [dependencies](./tasks/dependencies) - group of tasks to manage/sync/update dependency versions for all modules.

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

```json
{
  "scripts": {
    "prepush": "lerna-script update-repo-urls"
  }
}
```

and add export to `lerna.js`:

```js
const npmfix = require('lerna-script-tasks-npmfix')

module.exports['update-repo-urls'] = npmfix()
```

## External presets

You can also use presets or otherwise tasks exprted by external modules. `lerna-script` by default reads tasks from `lerna.js`,
but you can actually write tasks in any other file(module) and define it in your `lerna.json` like:

```json
{
  "lerna-script-tasks": "./tasks.js"
}
```
