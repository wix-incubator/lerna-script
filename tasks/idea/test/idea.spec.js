const {empty} = require('lerna-script-test-utils'),
  {expect} = require('chai').use(require('sinon-chai')),
  idea = require('..'),
  sinon = require('sinon'),
  shelljs = require('shelljs');

describe('idea', () => {

  it('should generate idea project files', () => {
    const log = loggerMock();
    return aLernaProject().within(() => {
      return idea(log).then(() => assertIdeaFilesGenerated());
    });
  });

  it('should set language level to ES6', () => {
    const log = loggerMock();
    return aLernaProject().within(() => {
      return idea(log).then(() => {
        expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string('<property name="JavaScriptLanguageLevel" value="ES6" />');
      });
    });
  });

  it.skip('removes existing .idea project files before generating new ones', () => {
    const log = loggerMock();
    const project = aLernaProject()
      .addFile('.idea/some-existing-file.txt', 'qwe');

    return project.within(() => {
      return idea(log).then(() => {
        expect(shelljs.test('-f', '.idea/some-existing-file.txt')).to.equal(false);
      });
    });
  });

  it('generates [module-name].iml with node_modules excluded so idea would not index all deps', () => {
    const log = loggerMock();
    return aLernaProject().within(() => {
      return idea(log).then(() => {
        expect(shelljs.cat('nested/a/a.iml').stdout).to.be.string('<excludeFolder url="file://$MODULE_DIR$/node_modules" />');
      });
    });
  });

  it('generates [module-name].iml and marks test/tests as test root', () => {
    const log = loggerMock();
    const project = aLernaProject()
      .addFolder('nested/a/test')
      .addFolder('nested/a/tests');

    return project.within(() => {
      return idea(log).then(() => {
        const imlFile = shelljs.cat('nested/a/a.iml').stdout;
        expect(imlFile).to.be.string('<sourceFolder url="file://$MODULE_DIR$/test" isTestSource="true" />');
        expect(imlFile).to.be.string('<sourceFolder url="file://$MODULE_DIR$/tests" isTestSource="true" />');
      });
    });
  });

  it('generates [module-name].iml and marks src/lib/scripts as source roots', () => {
    const log = loggerMock();
    const project = aLernaProject()
      .addFolder('nested/a/src')
      .addFolder('nested/a/lib')
      .addFolder('nested/a/scripts');

    return project.within(() => {
      return idea(log).then(() => {
        const imlFile = shelljs.cat('nested/a/a.iml').stdout;
        expect(imlFile).to.be.string('<sourceFolder url="file://$MODULE_DIR$/src" isTestSource="false" />');
        expect(imlFile).to.be.string('<sourceFolder url="file://$MODULE_DIR$/lib" isTestSource="false" />');
        expect(imlFile).to.be.string('<sourceFolder url="file://$MODULE_DIR$/scripts" isTestSource="false" />');
      });
    });
  });

  it('generates Mocha run configurations for all modules with mocha, interpreter and env set', () => {
    const log = loggerMock();
    return aLernaProject().within(() => {
      return idea(log).then(() => {
        const node = shelljs.exec('which node').stdout.split('/node/')[1].replace('\n', '');

        expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string('$PROJECT_DIR$/nested/a/node_modules/mocha');
        expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string('<configuration default="false" name="a" type="mocha-javascript-test-runner" factoryName="Mocha">');
        expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string('<env name="DEBUG" value="wix:*" />');
        expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string('<test-kind>PATTERN</test-kind>');
        expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string('<test-pattern>test/**/*.spec.js test/**/*.it.js test/**/*.e2e.js</test-pattern>');
        expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(`${node}</node-interpreter>`);
      });
    });
  });

  it('adds modules to groups if they are in subfolders', () => {
    const log = loggerMock();
    return aLernaProject().within(() => {
      return idea(log).then(() => {
        const modulesXml = shelljs.cat('.idea/modules.xml').stdout;

        expect(modulesXml).to.be.string('group="nested"');
        expect(modulesXml).to.not.be.string('group="a"');
        expect(modulesXml).to.not.be.string('group="ba"');
      });
    });
  });


  it('creates git-based ./idea/vcs.xml', () => {
    const log = loggerMock();
    return aLernaProject().within(() => {
      return idea(log).then(() => {
        expect(shelljs.cat('.idea/vcs.xml').stdout).to.be.string('<mapping directory="$PROJECT_DIR$" vcs="Git" />');
      });
    });
  });

  function aLernaProject() {
    return empty()
      .addFile('package.json', {"name": "root", version: "1.0.0"})
      .addFile('lerna.json', {"lerna": "2.0.0", "packages": ["nested/**"], "version": "0.0.0"})
      .module('nested/a', module => module.packageJson({version: '1.0.0'}))
      .module('nested/ba', module => module.packageJson({name: 'b', version: '1.0.1', dependencies: {'a': '~1.0.0'}}))
      .module('nested/c', module => module.packageJson({name: 'c', version: '1.0.1', dependencies: {'a': '~1.0.0'}}));
  }

  function assertIdeaFilesGenerated() {
    expect(shelljs.test('-d', '.idea')).to.equal(true);
    expect(shelljs.test('-f', '.idea/workspace.xml')).to.equal(true);
    expect(shelljs.test('-f', '.idea/vcs.xml')).to.equal(true);
    expect(shelljs.test('-f', '.idea/modules.xml')).to.equal(true);
    expect(shelljs.test('-f', 'nested/a/a.iml')).to.equal(true);
    expect(shelljs.test('-f', 'nested/ba/b.iml')).to.equal(true);
    expect(shelljs.test('-f', 'nested/c/c.iml')).to.equal(true);
  }

  function loggerMock() {
    return {
      info: sinon.spy()
    };
  }

});