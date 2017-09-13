const {aLernaProjectWith2Modules, loggerMock} = require('lerna-script-test-utils'),
  shelljs = require('shelljs'),
  {expect} = require('chai'),
  preset = require('..');

describe('wix-npm preset', () => {

  it('is a valid preset', () => {
    const project = aLernaProjectWith2Modules();
    const log = loggerMock();

    return project.within(ctx => {
      ctx.addFile('packages/a/npm-debug.log');
      return preset.clean(log).then(() => {
        expect(shelljs.test('-f', 'packages/a/npm-debug.log')).to.equal(true);
      });
    });
  });

});