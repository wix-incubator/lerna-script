const {aLernaProjectWith2Modules, loggerMock, fs} = require('lerna-script-test-utils'),
  {loadPackages} = require('lerna-script'),
  {expect} = require('chai'),
  npmfix = require('..');

describe('npmfix task', () => {

  it('should update docs, repo url in package.json', () => {
    const project = aLernaProjectWith2Modules();
    const log = loggerMock();

    return project.within(ctx => {
      ctx.exec('git remote add origin git@github.com:git/qwe.git');
      return npmfix()(log).then(() => {
        expect(fs.readJson('./packages/a/package.json')).to.contain.property('homepage', 'https://github.com/git/qwe/tree/master/packages/a');
        expect(fs.readJson('./packages/a/package.json')).to.contain.deep.property('repository.type', 'git');
        expect(fs.readJson('./packages/a/package.json')).to.contain.deep.property('repository.url', 'https://github.com/git/qwe');

        expect(fs.readJson('./packages/b/package.json')).to.contain.property('homepage', 'https://github.com/git/qwe/tree/master/packages/b');
      });
    });
  });

  it('should update only for provided modules', () => {
    const project = aLernaProjectWith2Modules();
    const log = loggerMock();

    return project.within(ctx => {
      ctx.exec('git remote add origin git@github.com:git/qwe.git');

      const packages = loadPackages().filter(p => p.name === 'a');
      return npmfix({packages})(log).then(() => {
        expect(fs.readJson('./packages/a/package.json')).to.contain.property('homepage', 'https://github.com/git/qwe/tree/master/packages/a');
        expect(fs.readJson('./packages/b/package.json')).to.not.contain.property('homepage');
      });
    });
  });
});