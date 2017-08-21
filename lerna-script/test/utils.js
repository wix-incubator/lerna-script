const {empty} = require('lerna-script-test-utils'),
  sinon = require('sinon'),
  index = require('..'),
  intercept = require('intercept-stdout');

module.exports.empty = empty;

module.exports.aLernaProject = () => {
  return empty()
    .addFile('package.json', {"name": "root", version: "1.0.0"})
    .addFile('lerna.json', {"lerna": "2.0.0", "packages": ["nested/**"], "version": "0.0.0"})
    .module('nested/a', module => module.packageJson({version: '1.0.0'}))
    .module('nested/b', module => module.packageJson({name: 'b', version: '1.0.1', dependencies: {'a': '~1.0.0'}}))
    .inDir(ctx => ctx.exec('git init'));
};

module.exports.aLernaProjectWithSpec = (spec = {'a': [], 'b': ['a']}) => {
  const project = empty()
    .addFile('package.json', {"name": "root", version: "1.0.0"})
    .addFile('lerna.json', {"lerna": "2.0.0", "packages": ["nested/**"], "version": "0.0.0"});

  Object.keys(spec).forEach(name => {
    project.module(`nested/${name}`, module => {
      const dependencies = {};
      spec[name].forEach(dep => dependencies[dep] = "1.0.0");
      module.packageJson({version: '1.0.0', dependencies});
    });
  });

  return project.inDir(ctx => ctx.exec('git init'));
};

module.exports.asBuilt = (project, {label, log} = {}) => {
  return project.inDir(ctx => {
    const lernaPackages = index.loadPackages({log});
    lernaPackages.forEach(lernaPackage => index.changes.build(lernaPackage, {log})(label));
    ctx.exec('sleep 1'); //so that second would rotate
  });
};

module.exports.asGitCommited = project => {
  return project.inDir(ctx => {
    ctx.exec('git add -A && git commit -am "init"');
  });
};

module.exports.loggerMock = () => {
  return {
    verbose: sinon.spy(),
    warn: sinon.spy(),
    silly: sinon.spy(),
    info: sinon.spy(),
  };
};

module.exports.captureOutput = () => {
  let capturedOutput = "";
  let detach;

  beforeEach(() => detach = intercept(txt => {
    capturedOutput += txt;
  }));

  afterEach(() => {
    detach();
    capturedOutput = "";
  });


  return () => capturedOutput;
};
