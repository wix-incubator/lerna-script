# lerna-script

For usage documentation please see [root of repo](../README.md);

# API

### packages(): LernaPackages[]
Returns list of packages/modules in repo - forward to lerna;

### rootPackage(): LernaPackage[]
Returns [Package](https://github.com/lerna/lerna/blob/master/src/Package.js) of root module. 

LernaPackage is [Package in lerna](https://github.com/lerna/lerna/blob/master/src/Package.js).
 
### iter.forEach(lernaPackages: [], task: lernaPackage => Promise): Promise(taskResults: [])
Executed provided command for all `lernaPackages` in a serial fashion. `taskFn` can be either sync task or return a `Promise`.

### iter.parallel(lernaPackages: [], , task: lernaPackage => Promise): Promise(taskResults: [])
Executed provided command for all `lernaPackages` in a parallel fashion. `taskFn` can be either sync task or return a `Promise`.

### iter.batched(lernaPackages: [], , task: lernaPackage => Promise): Promise(undefined)
Executed provided command for all `lernaPackages` in a batched fashion respecting dependency graph. `taskFn` can be either sync task or return a `Promise`.

### exec.command(lernaPackage, {silent = true})(command): Promise(stdout)
Executes given command for a package and returns collected `stdout`.

Argument list #1:
 - lernaPackage - package returned either by `rootPackage()` or `packages()`;
 - silent - should command output be streamed to stdout/stderr or suppressed. Defaults to `true`; 

Argument list #2:
 - command - command to execute;
 
Returns:
 - stdout - collected output; 
 
### exec.script(lernaPackage, {silent = true})(script): Promise(stdout)
Executes given npm script for a package and returns collected `stdout`.

Argument list #1:
 - lernaPackage - package returned either by `rootPackage()` or `packages()`;
 - silent - should script output be streamed to stdout/stderr or suppressed. Defaults to `true`;

Argument list #2:
 - script - npm script to execute;
 
Returns:
 - stdout - collected output;