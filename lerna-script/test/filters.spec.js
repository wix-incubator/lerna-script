const {expect} = require('chai'),
  {aLernaProject, asBuilt, asGitCommited, empty} = require('./utils'),
  index = require('..');

describe('filters', function () {
  this.timeout(5000);

  describe('removeByGlob', () => {

    it('should filter-out packages by provided glob', () => {
      const project = aLernaProject();

      return project.within(() => {
        const lernaPackages = index.filters.removeByGlob(index.loadPackages())('a');
        expect(lernaPackages.map(p => p.name)).to.have.same.members(['b']);
      });
    });
  });

  describe('removeBuilt', () => {

    it('should not filter-out any packages for unbuilt project', () => {
      const project = aLernaProject();

      return project.within(() => {
        const unbuiltLernaPackages = index.filters.removeBuilt(index.loadPackages())();
        expect(unbuiltLernaPackages.length).to.equal(2);
      })
    });

    it('should filter-out changed packages', () => {
      const project = asBuilt(asGitCommited(aLernaProject()));

      return project.within(() => {
        const packages = index.loadPackages();
        index.changes.unbuild(packages.find(p => p.name === 'b'))();
        const unbuiltLernaPackages = index.filters.removeBuilt(packages)();
        expect(unbuiltLernaPackages.length).to.equal(1);
      });
    });

    it('should filter-out packages whose dependencies changed', () => {
      const project = asBuilt(asGitCommited(aLernaProject()));

      return project.within(() => {
        const lernaPackages = index.loadPackages();
        index.changes.unbuild(lernaPackages.find(lernaPackage => lernaPackage.name === 'b'))();

        const unbuiltLernaPackages = index.filters.removeBuilt(lernaPackages)();
        expect(unbuiltLernaPackages.length).to.equal(1);
      });
    });

    it('should respect labels when filtering-out packages', () => {
      const project = asBuilt(asGitCommited(aLernaProject()), 'woop');

      return project.within(() => {
        const lernaPackages = index.loadPackages();

        index.changes.unbuild(lernaPackages.find(lernaPackage => lernaPackage.name === 'b'))();
        expect(index.filters.removeBuilt(lernaPackages)('woop').length).to.equal(0);

        index.changes.unbuild(lernaPackages.find(lernaPackage => lernaPackage.name === 'b'))('woop');
        expect(index.filters.removeBuilt(lernaPackages)('woop').length).to.equal(1);
      });
    });


    it('should unmark dependents as built', () => {
      const project = asBuilt(asGitCommited(aLernaProject()));

      return project.within(ctx => {
        const lernaPackages = index.loadPackages();
        index.changes.unbuild(lernaPackages.find(lernaPackage => lernaPackage.name === 'a'))();

        expect(index.filters.removeBuilt(lernaPackages)().length).to.equal(2);

        index.changes.build(lernaPackages.find(lernaPackage => lernaPackage.name === 'a'))();
        ctx.exec('sleep 1');
        expect(index.filters.removeBuilt(lernaPackages)().length).to.equal(1);
      })
    });

  });

  describe('filters.gitSince', () => {

    it('removes modules without changes', () => {
      return empty()
        .addFile('package.json', {"name": "root", version: "1.0.0"})
        .addFile('lerna.json', {"lerna": "2.0.0", "packages": ["nested/**"], "version": "0.0.0"})
        .module('nested/a', module => module.packageJson({name: 'a', version: '2.0.0'}))
        .module('nested/ba', module => module.packageJson({
          name: 'ba',
          version: '1.0.0',
          dependencies: {'b': '~1.0.0'}
        }))
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
          const lernaPackages = index.filters.gitSince(index.loadPackages())('master');
          expect(lernaPackages.map(p => p.name)).to.have.same.members(['b', 'ba']);
        });
    });
  });
});