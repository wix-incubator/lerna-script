const {expect} = require('chai').use(require('sinon-chai')),
  {aLernaProject, loggerMock, empty} = require('./utils'),
  index = require('..'),
  intercept = require('intercept-stdout');

describe('exec', () => {
  let capturedOutput = "";
  let detach;

  beforeEach(() => detach = intercept(txt => {
    capturedOutput += txt;
  }));

  afterEach(() => {
    detach();
    capturedOutput = "";
  });


  describe('command', () => {

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

  describe('script', () => {

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
});