const {expect} = require('chai'),
  {empty} = require('octopus-test-utils'),
  index = require('..');

describe.only('index', () => {

  describe('packages', () => {

    it('should return a list of packages', () => {
      return aLernaProject().within(() => {
        const packages = index.packages();

        expect(packages.length).to.equal(2);
      });
    });
  });

  function aLernaProject() {
    return empty()
      .addFile('lerna.json', {"lerna": "2.0.0", "packages": ["**"], "version": "0.0.0"})
      .module('a', module => module.packageJson({version: '1.0.0'}))
      .module('nested/b', module => module.packageJson({name: 'c', version: '1.0.1', dependencies: {'a': '~1.0.0'}}));
  }
});