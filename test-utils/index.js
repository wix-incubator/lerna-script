const {resolve} = require('path'),
  ModuleBuilder = require('./lib/module-builder'),
  {readFileSync, writeFileSync} = require('fs'),
  {join} = require('path'),
  fsExtra = require('fs-extra'),
  os = require('os'),
  sinon = require('sinon')

const TEMP_DIR = os.tmpdir()

function empty() {
  const projectDir = resolve(TEMP_DIR, Math.ceil(Math.random() * 100000).toString())
  afterEach(done => fsExtra.remove(projectDir, done))
  return new ModuleBuilder(process.cwd(), projectDir, true)
}

function readJson(name, dir = process.cwd()) {
  return JSON.parse(readFileSync(join(dir, name)).toString())
}

function readFile(name, dir = process.cwd()) {
  return readFileSync(join(dir, name)).toString()
}

function writeJson(name, content, dir = process.cwd()) {
  return writeFileSync(join(dir, name), JSON.stringify(content))
}

function aLernaProjectWith2Modules() {
  return aLernaProject({a: [], b: ['a']})
}

function aLernaProject(spec = {}, overrides = {}) {
  const project = empty()
    .packageJson({name: 'root'})
    .lernaJson()
    .inDir(ctx => ctx.exec('git init'))

  Object.keys(spec).forEach(name => {
    project.module(`packages/${name}`, module => {
      const dependencies = {}
      spec[name].forEach(dep => (dependencies[dep] = '1.0.0'))
      module.packageJson(Object.assign({version: '1.0.0', dependencies}, overrides))
    })
  })

  return project.inDir(ctx => ctx.exec('git init'))
}

function loggerMock() {
  const item = {
    finish: sinon.spy(),
    completeWork: sinon.spy(),
    verbose: sinon.spy(),
    warn: sinon.spy(),
    silly: sinon.spy(),
    info: sinon.spy(),
    pause: sinon.spy(),
    error: sinon.spy(),
    resume: sinon.spy()
  }

  const group = {
    finish: sinon.spy(),
    verbose: sinon.spy(),
    warn: sinon.spy(),
    silly: sinon.spy(),
    info: sinon.spy(),
    error: sinon.spy(),
    newItem: sinon.stub().returns(item)
  }

  return {
    verbose: sinon.spy(),
    warn: sinon.spy(),
    silly: sinon.spy(),
    info: sinon.spy(),
    error: sinon.spy(),
    newItem: sinon.stub().returns(item),
    newGroup: sinon.stub().returns(group),
    item,
    group
  }
}

module.exports = {
  empty,
  aLernaProjectWith2Modules,
  aLernaProject,
  fs: {
    readJson,
    writeJson,
    readFile
  },
  loggerMock
}
