const path = require('path'),
  {ensureDirSync, removeSync} = require('fs-extra'),
  {readFileSync, writeFileSync} = require('fs'),
  {execSync} = require('child_process'),
  Promise = require('bluebird');

class ModuleBuilder {
  constructor(cwd, dir, isRoot) {
    this._isRoot = isRoot || false;
    this._cwd = cwd;
    this._dir = dir;
    this.addFolder(this._dir);
  }

  get dir() {
    return this._dir;
  }

  get cwd() {
    return this._cwd;
  }

  get isRoot() {
    return this._isRoot;
  }

  inDir(fn) {
    process.chdir(this.dir);

    try {
      fn(this);
    } finally {
      process.chdir(this.cwd);
    }

    return this;
  }

  packageJson(overrides) {
    return this.addFile('package.json', aPackageJson(this._dir.split('/').pop(), overrides));
  }

  addFile(name, payload) {
    this.addFolder(path.dirname(name));

    if (payload && typeof payload !== 'string') {
      writeFileSync(path.join(this._dir, name), JSON.stringify(payload, null, 2));
    } else {
      writeFileSync(path.join(this._dir, name), payload || '');
    }

    return this;
  }

  addFolder(name) {
    ensureDirSync(path.resolve(this._dir, name));
    return this;
  }

  module(name, cb) {
    const module = new ModuleBuilder(this._cwd, path.join(this._dir, name), false);

    if (cb) {
      inDir(cb, module);
    } else {
      this.inDir(m => m.packageJson(m.dir.split('/').pop()), module);
    }
    return this;
  }

  exec(cmd) {
    try {
      return execSync(cmd).toString();
    } catch (e) {
      throw new Error(`Script exited with error code: ${e.status} and output ${e.stdout} + ${e.stderr}`);
    }
  }

  readFile(path) {
    return readFileSync(path).toString();
  }

  readJsonFile(path) {
    return JSON.parse(this.readFile(path));
  }

  within(fn) {
    const clean = () => {
      process.chdir(this.cwd);
      removeSync(this.dir);
    };

    process.chdir(this.dir);

    return Promise.resolve()
      .then(() => fn(this))
      .finally(clean);
  }
}

function aPackageJson(name, overrides) {
  return Object.assign({}, {
    name: name,
    version: '1.0.0',
    description: '',
    main: 'index.js',
    scripts: {
      test: 'echo "test script"',
      build: 'echo "build script"',
      release: 'echo "release script"'
    },
    author: '',
    license: 'ISC'
  }, overrides);
}


function inDir(fn, module) {
  process.chdir(module.dir);

  try {
    fn(module);
  } finally {
    process.chdir(module.cwd);
  }

  return module;
}


module.exports = ModuleBuilder;
