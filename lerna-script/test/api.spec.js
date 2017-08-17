const {expect} = require('chai').use(require('sinon-chai')),
  sinon = require('sinon'),
  {empty} = require('lerna-script-test-utils'),
  index = require('..'),
  intercept = require('intercept-stdout');

describe('api', () => {
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
      const log = loggerMock();

      return aLernaProject().within(() => {
        const packages = index.packages({log});

        expect(packages.length).to.equal(2);
        expect(log.verbose).to.have.been.calledWithMatch('loadPackages');
      });
    });
  });

  describe('rootPackage', () => {

    it('should return a root package', () => {
      const log = loggerMock();

      return aLernaProject().within(() => {
        const rootPackage = index.rootPackage({log});

        expect(rootPackage.name).to.equal('root');
        expect(rootPackage.location).to.equal(process.cwd());
        expect(log.verbose).to.have.been.calledWithMatch('loadRootPackage');
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
      const log = loggerMock();

      return aLernaProject().within(() => {
        const lernaPackage = index.packages().pop();

        return index.exec.command('pwd')(lernaPackage, {log}).then(stdout => {
          expect(log.silly).to.have.been.calledWith("runCommand", 'pwd', {cwd: lernaPackage.location, silent: true});
          expect(stdout).to.equal(lernaPackage.location);
          expect(capturedOutput).to.not.contain(lernaPackage.location);
        });
      });
    });

    it('should print output if enabled', () => {
      return aLernaProject().within(() => {
        const lernaPackage = index.packages().pop();

        return index.exec.command('pwd')(lernaPackage, {silent: false}).then(stdout => {
          expect(stdout).to.equal(lernaPackage.location);
          expect(capturedOutput).to.contain(lernaPackage.location);
        });
      });
    });

    it('should reject for a failing command', done => {
      aLernaProject().within(() => {
        const lernaPackage = index.packages().pop();

        index.exec.command('asd zzz')(lernaPackage).catch(e => {
          expect(e.message).to.contain('spawn asd ENOENT');
          done();
        });
      });
    });
  });

  describe('exec.script', () => {

    it('should execute npm script for package and return output', () => {
      const project = empty()
        .addFile('package.json', {"name": "root", version: "1.0.0", scripts: {test: 'echo tested'}});

      return project.within(() => {
        const lernaPackage = index.rootPackage();

        return index.exec.script('test')(lernaPackage).then(stdout => {
          expect(stdout).to.contain('tested');
          expect(capturedOutput).to.not.contain('tested');
        });
      });
    });

    it('should stream output to stdour/stderr if silent=false', () => {
      const project = empty()
        .addFile('package.json', {"name": "root", version: "1.0.0", scripts: {test: 'echo tested'}});

      return project.within(() => {
        const lernaPackage = index.rootPackage();

        return index.exec.script('test')(lernaPackage, {silent: false}).then(stdout => {
          expect(stdout).to.contain('tested');
          expect(capturedOutput).to.contain('tested');
        });
      });
    });

    //TODO: it looks like this one rejects a promise, traced to execa line 210
    it('should reject for a failing script', done => {
      const project = empty()
        .addFile('package.json', {"name": "root", version: "1.0.0", scripts: {test: 'qwe zzz'}});

      project.within(() => {
        const lernaPackage = index.rootPackage();

        index.exec.script('test')(lernaPackage).catch(e => {
          expect(e.message).to.contain('Command failed: npm run test');
          done();
        });
      });
    });

    it('should skip a script and log a warning if its missing', () => {
      const log = loggerMock();
      const project = empty()
        .addFile('package.json', {"name": "root", version: "1.0.0"});

      return project.within(() => {
        const lernaPackage = index.rootPackage();

        return index.exec.script('test')(lernaPackage, {log}).then(stdout => {
          expect(stdout).to.equal('');
          expect(log.warn).to.have.been.calledWith('runNpmScript', 'script not found', {
            script: 'test',
            cwd: lernaPackage.location
          });
        });
      });
    });
  });


  describe('filters.gitSince', () => {

    it('removes modules without changes', () => {
      return empty()
        .addFile('package.json', {"name": "root", version: "1.0.0"})
        .addFile('lerna.json', {"lerna": "2.0.0", "packages": ["nested/**"], "version": "0.0.0"})
        .module('nested/a', module => module.packageJson({name: 'a', version: '2.0.0'}))
        .module('nested/ba', module => module.packageJson({name: 'ba', version: '1.0.0', dependencies: {'b': '~1.0.0'}}))
        .inDir(ctx => {
          ctx.exec('git init && git config user.email mail@example.org && git config user.name name');
          ctx.exec('git add -A && git commit -am ok');
          ctx.exec('git checkout -b test');
        })
        .module('nested/b', module => module.packageJson({name: 'b', version: '1.0.0'}))
        .inDir(ctx => {
          ctx.exec('git add -A && git commit -am ok');
        })
        .within(() => {
          const lernaPackages = index.filter.gitSince(index.packages())('master');
          expect(lernaPackages.map(p => p.name)).to.have.same.members(['b', 'ba']);
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

  function loggerMock() {
    return {
      verbose: sinon.spy(),
      warn: sinon.spy(),
      silly: sinon.spy(),
    };
  }

});