const {expect} = require('chai').use(require('sinon-chai')),
  sinon = require('sinon'),
  {empty} = require('lerna-script-test-utils'),
  index = require('..'),
  intercept = require('intercept-stdout'),
  {join} = require('path'),
  {writeFileSync} = require('fs');

describe('detect-changes', () => {

  it('should not detect any changes for already marked modules', () => {
    const project = asBuilt(asGitCommited(aLernaProject()));

    return project.within(() => {
      const lernaPackages = index.packages();
      lernaPackages.forEach(lernaPackage => expect(index.changes.isBuilt(lernaPackage)).to.equal(true));
    });
  });

  it('should detect uncommitted modules as changed', () => {
    const project = aLernaProject();

    return project.within(() => {
      const lernaPackages = index.packages();
      lernaPackages.forEach(lernaPackage => expect(index.changes.isBuilt(lernaPackage)).to.equal(false));
    });
  });

  it('should detect change in module', () => {
    const project = asBuilt(asGitCommited(aLernaProject()));

    return project.within(() => {
      const aLernaPackage = index.packages().pop();
      writeFileSync(join(aLernaPackage.location, 'some.txt'), 'qwe');

      expect(index.changes.isBuilt(aLernaPackage)).to.equal(false);
    });
  });

  it('should respect .gitignore in root', () => {
    const projectWithGitIgnore = aLernaProject().inDir(ctx => {
      ctx.addFile('.gitignore', 'some.txt\n');
    });

    const project = asBuilt(asGitCommited(projectWithGitIgnore));

    return project.within(() => {
      const aLernaPackage = index.packages().pop();
      writeFileSync(join(aLernaPackage.location, 'some.txt'), 'qwe');

      expect(index.changes.isBuilt(aLernaPackage)).to.equal(true);
    });
  });

  it('should respect .gitignore in module dir', () => {
    const projectWithGitIgnore = aLernaProject().inDir(ctx => {
      ctx.addFile('nested/a/.gitignore', 'some.txt\n');
    });

    const project = asBuilt(asGitCommited(projectWithGitIgnore));

    return project.within(() => {
      const aLernaPackage = index.packages().find(lernaPackage => lernaPackage.name === 'a');
      writeFileSync(join(aLernaPackage.location, 'some.txt'), 'qwe');

      expect(index.changes.isBuilt(aLernaPackage)).to.equal(true);
    });
  });

  it('should should unbuild a module', () => {
    const project = asBuilt(asGitCommited(aLernaProject()));

    return project.within(() => {
      const aLernaPackage = index.packages().pop();
      index.changes.unbuild(aLernaPackage);

      expect(index.changes.isBuilt(aLernaPackage)).to.equal(false);
    });
  });


  function asBuilt(project) {
    return project.inDir(ctx => {
      const lernaPackages = index.packages();
      lernaPackages.forEach(lernaPackage => index.changes.build(lernaPackage));
      ctx.exec('sleep 1'); //so that second would rotate
    });
  }

  function asGitCommited(project) {
    return project.inDir(ctx => {
      ctx.exec('git add -A && git commit -am "init"');
    });
  }

  function aLernaProject() {
    return empty()
      .addFile('package.json', {"name": "root", version: "1.0.0"})
      .addFile('lerna.json', {"lerna": "2.0.0", "packages": ["nested/**"], "version": "0.0.0"})
      .module('nested/a', module => module.packageJson({version: '1.0.0'}))
      .module('nested/b', module => module.packageJson({name: 'b', version: '1.0.1', dependencies: {'a': '~1.0.0'}}))
      .inDir(ctx => ctx.exec('git init'));
  }

});