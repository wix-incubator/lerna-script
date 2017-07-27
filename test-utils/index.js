const {resolve} = require('path'),
  ModuleBuilder = require('./lib/module-builder'),
  {rm} = require('shelljs'),
  {readFileSync, writeFileSync} = require('fs'),
  {join} = require('path');

const TEMP_DIR = './target';

module.exports.empty = () => {
  const projectDir = resolve(TEMP_DIR, Math.ceil(Math.random() * 100000).toString());
  afterEach(() => rm('-rf', projectDir));
  return new ModuleBuilder(process.cwd(), projectDir, true);
};

module.exports.fs = {
  readJson: (name, dir = process.cwd()) => JSON.parse(readFileSync(join(dir, name)).toString()),
  writeJson: (name, content, dir = process.cwd()) => writeFileSync(join(dir, name), JSON.stringify(content))
};
