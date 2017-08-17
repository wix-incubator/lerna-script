const {expect} = require('chai'),
  {empty} = require('lerna-script-test-utils'),
  index = require('..');

describe('filters', () => {

  describe('removeBuilt', () => {

    it('should not filter-out any packages for unbuilt project', () => {
      const project = aLernaProject();

      return project.within(() => {
        const unbuiltLernaPackages = index.filter.removeBuilt(index.packages());
        expect(unbuiltLernaPackages.length).to.equal(2);
      })
    });

    it('should filter-out changed packages', () => {
      const project = asBuilt(asGitCommited(aLernaProject()));

      return project.within(() => {
        const unbuiltLernaPackages = index.filter.removeBuilt(index.packages());
        expect(unbuiltLernaPackages.length).to.equal(0);
      })
    });

    it('should filter-out packages whose dependencies changed', () => {
      const project = asBuilt(asGitCommited(aLernaProject()));

      return project.within(() => {
        const lernaPackages = index.packages();
        index.changes.unbuild(lernaPackages.find(lernaPackage => lernaPackage.name === 'a'));

        const unbuiltLernaPackages = index.filter.removeBuilt(lernaPackages);
        expect(unbuiltLernaPackages.length).to.equal(2);
      })
    });

    it.skip('should unmark dependents as built', () => {
      const project = asBuilt(asGitCommited(aLernaProject()));

      return project.within(() => {
        const lernaPackages = index.packages();
        index.changes.unbuild(lernaPackages.find(lernaPackage => lernaPackage.name === 'a'));

        const unbuiltLernaPackages = index.filter.removeBuilt(lernaPackages);
        expect(unbuiltLernaPackages.length).to.equal(2);
      })
    });

  });

  function asBuilt(project) {
    return project.inDir(ctx => {
      const lernaPackages = index.packages();
      lernaPackages.forEach(lernaPackage => index.changes.build(lernaPackage));
      ctx.exec('sleep 1'); //so that second would rotate on file change date
    });
  }

  function asGitCommited(project) {
    return project.inDir(ctx => ctx.exec('git add -A && git commit -am "init"'));
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