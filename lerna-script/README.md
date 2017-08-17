# lerna-script

For usage documentation please see [root of repo](../README.md);

# API

### packages(): LernaPackages[]
Returns list of packages/modules in repo - forward to lerna;

### rootPackage(): LernaPackage[]
Returns [Package](https://github.com/lerna/lerna/blob/master/src/Package.js) of root module. 

LernaPackage is [Package in lerna](https://github.com/lerna/lerna/blob/master/src/Package.js).
 
### iter.forEach(lernaPackages: [], task: lernaPackage => Promise, log): Promise(taskResults: [])
Executed provided command for all `lernaPackages` in a serial fashion. `taskFn` can be either sync task or return a `Promise`.

### iter.parallel(lernaPackages: [], , task: lernaPackage => Promise, log): Promise(taskResults: [])
Executed provided command for all `lernaPackages` in a parallel fashion(`Promise.all`). `taskFn` can be either sync task 
or return a `Promise`.

### iter.batched(lernaPackages: [], , task: lernaPackage => Promise, log): Promise(undefined)
Executed provided command for all `lernaPackages` in a batched fashion respecting dependency graph. `taskFn` can be either 
sync task or return a `Promise`.

### exec.command(command)(lernaPackage, {silent = true}): Promise(stdout)
Executes given command for a package and returns collected `stdout`.

Note that `command` is a single command, meaning `rm -f zzz` and not ex. `rm -f zzz && mkdir zzz`. It's just for convenience 
you can provide command and args as a single string. 

Argument list #1:
 - command - command to execute;

Argument list #2:
 - lernaPackage - package returned either by `rootPackage()` or `packages()`;
 - silent - should command output be streamed to stdout/stderr or suppressed. Defaults to `true`; 
 
Returns:
 - stdout - collected output; 
 
### exec.script(script)(lernaPackage, {silent = true}): Promise(stdout)
Executes given npm script for a package and returns collected `stdout`.

Argument list #1:
 - script - npm script to execute;

Argument list #2:
 - lernaPackage - package returned either by `rootPackage()` or `packages()`;
 - silent - should script output be streamed to stdout/stderr or suppressed. Defaults to `true`;
 
Returns:
 - stdout - collected output;
 
### changes.build(lernaPackage): undefined
Marks package as built.

### changes.unbuild(lernaPackage): undefined
Marks package as unbuilt.

### changes.isBuilt(lernaPackage): boolean
Returns true if package is build and false otherwise.

### filters.removeBuilt(lernaPackages: []): []
Filters-out packages that have been marked as built `changes.build` and were not changed since. Note that it filters-out also dependent packages, so if:
 - a, did not change, depends on b;
 - b, changed;
 - c, not changed, no inter-project dependencies.
 
Then it will return only `c` as `b` has changed and `a` depends on `b`, so it needs to be rebuilt/retested/re...
 
### filter.gitSince(lernaPackages: [])(refspec): []
Filters-out packages that have did not change since `refspec` - ex. master, brach, tag.
