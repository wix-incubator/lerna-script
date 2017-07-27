# lerna-script

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