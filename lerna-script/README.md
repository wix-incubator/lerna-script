# lerna-script

For usage documentation please see [root of repo](../README.md);

# API

### loadPackages({[log], [packages]}): LernaPackages[]
Returns list of packages/modules in repo - forward to lerna;

Parameters:
 - opts:
   - log: optional `npmlog` logger;
   - packages - optional list of package config. defaults to default lerna package config.

### loadRootPackage({[log]}): LernaPackage[]
Returns [Package](https://github.com/lerna/lerna/blob/master/src/Package.js) of root module. 

Parameters:
 - opts:
   - log: optional `npmlog` logger;
 
### iter.forEach(lernaPackages: [])(task: (lernaPackage, log) => Promise): Promise(taskResults: [])
Executed provided command for all `lernaPackages` in a serial fashion. `taskFn` can be either sync task or return a `Promise`.

### iter.parallel(lernaPackages: [])(task: (lernaPackage, log) => Promise): Promise(taskResults: [])
Executed provided command for all `lernaPackages` in a parallel fashion(`Promise.all`). `taskFn` can be either sync task 
or return a `Promise`.

### iter.batched(lernaPackages: [])(task: (lernaPackage, log) => Promise): Promise(undefined)
Executed provided command for all `lernaPackages` in a batched fashion respecting dependency graph. `taskFn` can be either 
sync task or return a `Promise`.

### exec.command(lernaPackage, {silent = true})(command): Promise(stdout)
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
 
### exec.script(lernaPackage, {silent = true})(script): Promise(stdout)
Executes given npm script for a package and returns collected `stdout`.

Argument list #1:
 - script - npm script to execute;

Argument list #2:
 - lernaPackage - package returned either by `rootPackage()` or `packages()`;
 - silent - should script output be streamed to stdout/stderr or suppressed. Defaults to `true`;
 
Returns:
 - stdout - collected output;
 
### changes.build(lernaPackage)([label]): undefined
Marks package as built.

Parameters:
 - lernaPackage - package to unbuild;
 - label, optional - given you have several exports scripts, you can separate them in different build/unbuild groups by label.

### changes.unbuild(lernaPackage)([label]): undefined
Marks package as unbuilt.

Parameters:
 - lernaPackage - package to unbuild;
 - label, optional - given you have several exports scripts, you can separate them in different build/unbuild groups by label

### changes.isBuilt(lernaPackage)([label]): boolean
Returns true if package is build and false otherwise.

Parameters:
 - lernaPackage - package to unbuild;
 - label, optional - given you have several exports scripts, you can separate them in different build/unbuild groups by label

### filters.removeBuilt(lernaPackages: [])([label]): []
Filters-out packages that have been marked as built `changes.build` and were not changed since. Note that it filters-out also dependent packages, so if:
 - a, did not change, depends on b;
 - b, changed;
 - c, not changed, no inter-project dependencies.
 
Then it will return only `c` as `b` has changed and `a` depends on `b`, so it needs to be rebuilt/retested/re...

Parameters:
 - lernaPackages - packages to filter;
 - label, optional - given you have several exports scripts, you can separate them in different build/unbuild groups by label

**Note:** this filter mutates built/unbuild state, meaning that it unbuilds dependents to get reproducible runs.

### filters.gitSince(lernaPackages: [])(refspec): []
Filters-out packages that have did not change since `refspec` - ex. master, brach, tag.

### filters.removeByGlob(lernaPackages: [])(glob: String): []
Filters-out packages by provided glob pattern.