const {resolve} = require('path'),
  ModuleBuilder = require('./lib/module-builder'),
  {readFileSync, writeFileSync} = require('fs'),
  {join} = require('path'),
  fsExtra = require('fs-extra'),
  os = require('os');

const TEMP_DIR = os.tmpdir();

module.exports.empty = () => {
  const projectDir = resolve(TEMP_DIR, Math.ceil(Math.random() * 100000).toString());
  afterEach(done => fsExtra.remove(projectDir, done));
  return new ModuleBuilder(process.cwd(), projectDir, true);
};

module.exports.fs = {
  readJson: (name, dir = process.cwd()) => JSON.parse(readFileSync(join(dir, name)).toString()),
  writeJson: (name, content, dir = process.cwd()) => writeFileSync(join(dir, name), JSON.stringify(content))
};
