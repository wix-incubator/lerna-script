const {expect} = require('chai').use(require('sinon-chai')),
  sinon = require('sinon'),
  {empty} = require('lerna-script-test-utils'),
  index = require('..'),
  intercept = require('intercept-stdout');

describe('index', () => {
  let capturedOutput = "";
  let detach;

  beforeEach(() => detach = intercept(txt => {
    capturedOutput += txt;
  }));

  afterEach(() => {
    detach();
    capturedOutput = "";
  });

  describe('packages', () => {

    it('should return a list of packages', () => {
      return aLernaProject().within(() => {
        const packages = index.packages();

        expect(packages.length).to.equal(2);
      });
    });
  });

  describe('rootPackage', () => {

    it('should return a root package', () => {
      return aLernaProject().within(() => {
        const rootPackage = index.rootPackage();

        expect(rootPackage.name).to.equal('root');
        expect(rootPackage.location).to.equal(process.cwd());
      });
    });
  });


  describe('iter.forEach', () => {

    it('should iterate through available packages', () => {
      const task = sinon.spy();

      return aLernaProject().within(() => {
        const packages = index.packages();

        return index.iter.forEach(packages, pkg => task(pkg.name)).then(() => {
          expect(task.getCall(0).args[0]).to.equal('a');
          expect(task.getCall(1).args[0]).to.equal('b');
        });
      });
    });
  });

  describe('iter.parallel', () => {

    //TODO: verify async nature?
    it('should iterate through available packages', () => {
      const task = sinon.spy();

      return aLernaProject().within(() => {
        const packages = index.packages();

        return index.iter.parallel(packages, pkg => task(pkg.name)).then(() => {
          expect(task).to.have.been.calledWith('a');
          expect(task).to.have.been.calledWith('b');
        });
      });
    });
  });

  describe('iter.batched', () => {

    //TODO: verify batched nature
    it('should iterate through available packages', () => {
      const task = sinon.spy();

      return aLernaProject().within(() => {
        const packages = index.packages();

        return index.iter.batched(packages, pkg => task(pkg.name)).then(() => {
          expect(task).to.have.been.calledWith('a');
          expect(task).to.have.been.calledWith('b');
        });
      });
    });
  });

  describe('exec.command', () => {

    it('should execute command in package cwd and print output by default', () => {
      return aLernaProject().within(() => {
        const lernaPackage = index.packages().pop();

        return index.exec.command(lernaPackage)('pwd').then(stdout => {
          expect(stdout).to.equal(lernaPackage.location + '\n');
        })
      });
    });

    it('should not print output if disabled', () => {
      return aLernaProject().within(() => {
        const lernaPackage = index.packages().pop();

        return index.exec.command(lernaPackage, {verbose: false})('pwd').then(stdout => {
          expect(stdout).to.equal(lernaPackage.location + '\n');
          expect(capturedOutput).to.not.be.string(lernaPackage.location);
        })
      });
    });

  });


  function aLernaProject() {
    return empty()
      .addFile('package.json', {"name": "root", version: "1.0.0"})
      .addFile('lerna.json', {"lerna": "2.0.0", "packages": ["nested/**"], "version": "0.0.0"})
      .module('nested/a', module => module.packageJson({version: '1.0.0'}))
      .module('nested/b', module => module.packageJson({name: 'b', version: '1.0.1', dependencies: {'a': '~1.0.0'}}));
  }
});