const {EOL} = require('os'),
  Promise = require('bluebird'),
  fs = Promise.promisifyAll(require('fs')),
  {join} = require('path')

function readFile(lernaPackage) {
  return (relativePath, convert = content => content.toString()) => {
    return fs.readFileAsync(join(lernaPackage.location, relativePath)).then(convert)
  }
}

function writeFile(lernaPackage) {
  return (relativePath, content, converter) => {
    let toWrite = content
    if (converter) {
      toWrite = converter(content)
    } else if (content === Object(content)) {
      toWrite = JSON.stringify(content, null, 2) + EOL
    }
    return fs.writeFileAsync(join(lernaPackage.location, relativePath), toWrite)
  }
}

module.exports = {
  readFile,
  writeFile
}
