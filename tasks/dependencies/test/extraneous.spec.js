const {logExtraneous} = require('../lib/extraneous'),
  {loggerMock} = require('lerna-script-test-utils'),
  {expect} = require('chai').use(require('sinon-chai'));

describe('extraneous', () => {

  describe('logExtraneous', () => {

    it('should not log extraneous if none present', () => {
      const log = loggerMock();
      logExtraneous({deps: {}}, log, 'deps');

      expect(log.error).to.not.have.been.called;
    });
  });

});