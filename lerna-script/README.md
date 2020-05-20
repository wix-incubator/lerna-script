# lerna-script

For usage scenarios documentation please see [root of repo](../README.md);

# CLI

`lerna-script` exports a cli script:

```bash
lerna-script [options] <task>
```

where options:

- loglevel - set's loglevel, defaults to `info`;

task:

- one of exports defined in `lerna.js` file.

# API

### loadPackages({[log], [packageConfigs]}): Promise[LernaPackages[]]

Returns list of packages/modules in repo - forward to lerna;

Parameters:

- log, optional - `npmlog` logger;

### loadRootPackage({[log]}): Promise[LernaPackage[]]

Returns [Package](https://github.com/lerna/lerna/blob/master/src/Package.js) of root module.

Parameters:

- log, optional - `npmlog` logger;

### iter.forEach(lernaPackages, {[log], [build]})(task): Promise

Executed provided command for all `lernaPackages` in a serial fashion. `taskFn` can be either sync task or return a `Promise`.

Parameters:

- lernaPackages - list of lerna packages to iterate on;
- log - logger to be used for progress and pass-on to nested tasks;
- build - should a module be built as in `changes.build`;
- task - function to execute with signature `(lernaPackage, log) => Promise`.

Returns promise with task results.

### iter.parallel(lernaPackages, {[log], [build], [concurrency]})(task): Promise

Executed provided command for all `lernaPackages` in a parallel fashion(`Promise.all`). `taskFn` can be either sync task
or return a `Promise`.

Parameters:

- lernaPackages - list of lerna packages to iterate on;
- log - logger to be used for progress and pass-on to nested tasks;
- build - should a module be built as in `changes.build`;
- task - function to execute with signature `(lernaPackage, log) => Promise`.
- concurrency - number, defaults to `Infinity`. See [bluebird#map API](http://bluebirdjs.com/docs/api/promise.map.html#map-option-concurrency)

Returns promise with task results.

### iter.batched(lernaPackages, {[log], [build]})(task): Promise

Executed provided command for all `lernaPackages` in a batched fashion respecting dependency graph. `taskFn` can be either
sync task or return a `Promise`.

Parameters:

- lernaPackages - list of lerna packages to iterate on;
- log - logger to be used for progress and pass-on to nested tasks;
- build - should a module be built as in `changes.build`;
- task - function to execute with signature `(lernaPackage, log) => Promise`.

Returns promise without results (undefined).

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

### changes.build(lernaPackage, {[log]})([label]): undefined

Marks package as built.

Parameters:

- lernaPackage - package to build;
- log, optional - `npmlog` logger;
- label, optional - given you have several exports scripts, you can separate them in different build/unbuild groups by label.

### changes.unbuild(lernaPackage, {[log]})([label]): undefined

Marks package as unbuilt.

Parameters:

- lernaPackage - package to unbuild;
- log, optional - `npmlog` logger;
- label, optional - given you have several exports scripts, you can separate them in different build/unbuild groups by label

### changes.isBuilt(lernaPackage)([label]): boolean

Returns true if package is build and false otherwise.

Parameters:

- lernaPackage - package to unbuild;
- label, optional - given you have several exports scripts, you can separate them in different build/unbuild groups by label

### filters.removeBuilt(lernaPackages: [], {[log]})([label]: String): []

Filters-out packages that have been marked as built `changes.build` and were not changed since. Note that it filters-out also dependent packages, so if:

- a, did not change, depends on b;
- b, changed;
- c, not changed, no inter-project dependencies.

Then it will return only `c` as `b` has changed and `a` depends on `b`, so it needs to be rebuilt/retested/re...

Parameters:

- lernaPackages - packages to filter;
- log, optional - `npmlog` logger;
- label, optional - given you have several exports scripts, you can separate them in different build/unbuild groups by label

**Note:** this filter mutates built/unbuild state, meaning that it unbuilds dependents to get reproducible runs.

### filters.gitSince(lernaPackages: [], {[log]})(refspec: String): []

Filters-out packages that have did not change since `refspec` - ex. master, brach, tag.

Parameters:

- lernaPackages - packages to filter;
- log, optional - `npmlog` logger;
- refspec - git `refspec` = master, branchname, tag...

### filters.removeByGlob(lernaPackages: [], {[log]})(glob: String): []

Filters-out packages by provided glob pattern.

Parameters:

- lernaPackages - packages to filter;
- log, optional - `npmlog` logger;
- glob - glob pattern.

### filters.includeFilteredDeps(lernaPackages: [], {[log]})(filteredPackages: []): []

Returns a list of packages tgat includes dependencies of `filteredPackages` that are in `lernaPackages`.

Parameters:

- lernaPackages - all packages;
- log, optional - `npmlog` logger;
- filteredPackages - subset of `lernaPackages`.

### fs.readFile(lernaPackage)(relativePath, converter: buffer => ?): Promise[?]

Reads a file as string by default or accepts a custom converter.

Parameters:

- lernaPackage - a lerna package for cwd of reading;
- relativePath - file path relative to `lernaPackage` root.
- converter - a function to convert content, ex. `JSON.parse`

### fs.writeFile(lernaPackage)(relativePath, content, converter: type => string): Promise[String]

Writes string/buffer to file, accepts custom formatter.

Automatically detects and formats object.

Parameters:

- lernaPackage - a lerna package for cwd of reading;
- relativePath - file path relative to `lernaPackage` root.
- content - content of file.
- converter - function to convert provided type to string/buffer.
