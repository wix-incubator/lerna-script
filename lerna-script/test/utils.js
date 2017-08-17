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


module.exports.asBuilt = project => {
  return project.inDir(ctx => {
    const lernaPackages = index.packages();
    lernaPackages.forEach(lernaPackage => index.changes.build(lernaPackage));
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

