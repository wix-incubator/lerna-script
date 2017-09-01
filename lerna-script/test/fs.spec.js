const {expect} = require('chai'),
  {aLernaProjectWith2Modules} = require('lerna-script-test-utils'),
  index = require('..');

describe('fs', () => {

  describe('readFile', () => {

    it('should read a file in module dir and return content as string', () => {
      return aLernaProjectWith2Modules().within(() => {
        const lernaPackage = index.loadPackages().pop();

        return index.fs.readFile(lernaPackage)('package.json').then(fileContent => {
          expect(fileContent).to.be.string(`"name": "${lernaPackage.name}"`);
        });
      });
    });

    it('should read a file as json by providing custom converter', () => {
      return aLernaProjectWith2Modules().within(() => {
        const lernaPackage = index.loadPackages().pop();

        return index.fs.readFile(lernaPackage)('package.json', JSON.parse).then(fileContent => {
          expect(fileContent).to.contain.property('name', lernaPackage.name);
        });
      });
    });
  });

  describe('writeFile', () => {

    it('should write string to file', () => {
      return aLernaProjectWith2Modules().within(() => {
        const lernaPackage = index.loadPackages().pop();

        return index.fs.writeFile(lernaPackage)('qwe.txt', 'bubu')
          .then(() => index.fs.readFile(lernaPackage)('qwe.txt'))
          .then(fileContent => expect(fileContent).to.equal('bubu'));
      });
    });

    it('should write object', () => {
      return aLernaProjectWith2Modules().within(() => {
        const lernaPackage = index.loadPackages().pop();

        return index.fs.writeFile(lernaPackage)('qwe.json', {key: 'bubu'})
          .then(() => index.fs.readFile(lernaPackage)('qwe.json', JSON.parse))
          .then(fileContent => expect(fileContent).to.deep.equal({key: 'bubu'}));
      });
    });

    it('should accept custom serializer', () => {
      return aLernaProjectWith2Modules().within(() => {
        const lernaPackage = index.loadPackages().pop();

        return index.fs.writeFile(lernaPackage)('qwe.txt', 'bubu', c => 'a' + c)
          .then(() => index.fs.readFile(lernaPackage)('qwe.txt'))
          .then(fileContent => expect(fileContent).to.equal('abubu'));
      });
    });
  });

});
