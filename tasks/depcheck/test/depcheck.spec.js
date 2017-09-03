// const {aLernaProjectWith2Modules, loggerMock, fs} = require('lerna-script-test-utils'),
//   {loadPackages} = require('lerna-script'),
//   {expect} = require('chai').use(require('sinon-chai')),
//   npmfix = require('..');
//
// describe('npmfix task', () => {
//
//   it('should update docs, repo url in package.json', () => {
//     const project = aLernaProjectWith2Modules();
//     const log = loggerMock();
//
//     return project.within(ctx => {
//       ctx.exec('git remote add origin git@github.com:git/qwe.git');
//       return npmfix()(log).then(() => {
//         expect(log.info).to.have.been.calledWith('npmfix', 'fixing homepage, repo urls for 2 packages');
//         expect(fs.readJson('./packages/a/package.json')).to.contain.property('homepage', 'https://github.com/git/qwe/tree/master/packages/a');
//         expect(fs.readJson('./packages/a/package.json')).to.contain.deep.property('repository.type', 'git');
//         expect(fs.readJson('./packages/a/package.json')).to.contain.deep.property('repository.url', 'https://github.com/git/qwe/tree/master/packages/a');
//
//         expect(fs.readJson('./packages/b/package.json')).to.contain.property('homepage', 'https://github.com/git/qwe/tree/master/packages/b');
//       });
//     });
//   });
//
//   it('should update only for provided modules', () => {
//     const project = aLernaProjectWith2Modules();
//     const log = loggerMock();
//
//     return project.within(ctx => {
//       ctx.exec('git remote add origin git@github.com:git/qwe.git');
//
//       const packages = loadPackages().filter(p => p.name === 'a');
//       return npmfix({packages})(log).then(() => {
//         expect(fs.readJson('./packages/a/package.json')).to.contain.property('homepage', 'https://github.com/git/qwe/tree/master/packages/a');
//         expect(fs.readJson('./packages/b/package.json')).to.not.contain.property('homepage');
//       });
//     });
//   });
// });

const {aLernaProject, loggerMock} = require('lerna-script-test-utils'),
  {expect} = require('chai').use(require('sinon-chai')),
  depcheckTask = require('..');

describe('depcheck', () => {

  it('should fail for extraneous dependency', done => {
    const log = loggerMock();
    const project = aLernaProject()
      .module('b', module => {
        module.packageJson({version: '1.0.0', dependencies: {lodash: 'latest'}});
      });

    project.within(() => depcheckTask()(log))
      .catch(err => {
        expect(err.message).to.be.string('module b has unused dependencies: lodash');
        done();
      });
  });

  // it('should pass for no extraneous dependencies', () => {
  //   const project = empty()
  //     .module('a', module => {
  //       module.packageJson({name: 'a', version: '1.0.0'});
  //     })
  //     .module('b', module => {
  //       module.packageJson({version: '1.0.0', dependencies: {a: '~1.0.0'}});
  //       module.addFile('index.js', 'require("a")');
  //     });
  //
  //   return project.within(() => new Start()(depcheckTask()));
  // });

  // it('should respect provided overrides', () => {
  //   const depcheckOptions = {ignoreMatches: ['lodash']};
  //   const project = empty()
  //     .module('b', module => {
  //       module.packageJson({version: '1.0.0', dependencies: {lodash: 'latest'}});
  //     });
  //
  //   return project.within(() => new Start()(depcheckTask(depcheckOptions)));
  // });

  // it('build modules incrementally', () => {
  //   const reporter = sinon.spy();
  //   const project = empty()
  //     .module('a', module => module.packageJson({version: '1.0.0'}))
  //     .module('b', module => module.packageJson({version: '1.0.0'}));
  //
  //   return project.within(() => {
  //     return Promise.resolve()
  //       .then(() => new Start(reporter)(depcheckTask()))
  //       .then(() => expect(reporter).to.have.been.calledWith(sinon.match.any, sinon.match.any, 'Filtered-out 0 unchanged modules'))
  //       .then(() => removeSync('a/target'))
  //       .then(() => new Start(reporter)(depcheckTask()))
  //       .then(() => expect(reporter).to.have.been.calledWith(sinon.match.any, sinon.match.any, 'Filtered-out 1 unchanged modules'));
  //   });
  // });

});