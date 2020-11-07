const fs = require('fs')
const lernaScripts = require('lerna-script')

function listMonorepoPackages({packages} = {}) {
  return async log => {
    const lernaPackages = await (packages || lernaScripts.loadPackages())
    log.info('list-monorepo-packages', `add links for ${lernaPackages.length} packages`)

    const currentDirectories = listAllDirectoriesAt(__dirname)

    if (currentDirectories.length !== lernaPackages.length) {
      log.warn(
        'list-monorepo-packages',
        `count of projects (${lernaPackages.length}) does not equal count of directories (${currentDirectories.length})`
      )
    }

    const descriptions = []

    await lernaScripts.iter.parallel(lernaPackages, {log})((lernaPackage, log) => {
      return lernaScripts.fs
        .readFile(lernaPackage, {log})('package.json', JSON.parse)
        .then(packageJson => {
          descriptions.push({
            name: packageJson.name,
            description: packageJson.description ? packageJson.description : '',
            path: packageJson.homepage
              ? packageJson.homepage
              : `./tree/master/${lernaPackage.location.replace(lernaPackage.rootPath + '/', '')}`
          })
        })
    })

    const content = descriptions
      .map(
        ({name, description, path}, index) =>
          `- [${name}](${path})${description ? ' - ' + description : ''}`
      )
      .sort()
      .map((descriptionLine, index, fullArray) => {
        const isLast = fullArray.length - 1 === index

        return descriptionLine + (isLast ? '.' : ';')
      })
      .join('\n')

    tuneReadme('\n' + content, {
      log,
      markerName: 'list-of-projects-marker',
      rootReadmePath: './README.md'
    })
  }
}

function listAllDirectoriesAt(srcPath) {
  return fs
    .readdirSync(srcPath, {withFileTypes: true})
    .filter(dirEntry => dirEntry.isDirectory())
    .map(dirEntry => dirEntry.name)
    .filter(dirName => !dirName.startsWith('.') && dirName !== 'node_modules')
}

/**
 *
 * @param parameters
 * @param parameters.log - instance of npm-log
 * @param {'END', 'START'} parameters.markerCategory
 * @param {string} parameters.markerName
 */
function logTooMany({log, markerCategory, markerName}) {
  log.warn(
    'list-monorepo-packages',
    `too many ${markerCategory} markers: please leave only one "<!-- ${markerName} ${markerCategory} -->" in your root README.md file`
  )
}

/**
 *
 * @param parameters
 * @param parameters.log - instance of npm-log
 * @param {'END', 'START'} parameters.markerCategory
 * @param {string} parameters.markerName
 */
const logNotExist = ({log, markerCategory, markerName}) => {
  log.warn(
    'list-monorepo-packages',
    `missing ${markerCategory} marker: please add "<!-- ${markerName} ${markerCategory} -->" to your root README file`
  )
}

function tuneReadme(newContent, {log, markerName, rootReadmePath}) {
  fs.readFile(rootReadmePath, function read(err, data) {
    if (err) {
      throw err
    }

    const readmeContent = data.toString()
    const startMarker = `<!-- ${markerName} START -->`
    const startMarkerCount = (readmeContent.match(new RegExp(`${startMarker}`, 'g')) || []).length

    const endMarker = `<!-- ${markerName} END -->`
    const endMarkerCount = (readmeContent.match(new RegExp(`${endMarker}`, 'g')) || []).length

    if (startMarkerCount !== 1 || endMarkerCount !== 1) {
      if (startMarkerCount > 1) {
        logTooMany({
          log,
          markerCategory: 'START',
          markerName
        })
      }

      if (startMarkerCount < 1) {
        logNotExist({
          log,
          markerCategory: 'START',
          markerName
        })
      }

      if (endMarkerCount > 1) {
        logTooMany({
          log,
          markerCategory: 'END',
          markerName
        })
      }

      if (endMarkerCount < 1) {
        logNotExist({
          log,
          markerCategory: 'END',
          markerName
        })
      }

      return
    }

    const startIndex = readmeContent.indexOf(startMarker) + startMarker.length
    const contentBefore = readmeContent.substring(0, startIndex)

    const endIndex = readmeContent.indexOf(endMarker)
    const contentAfter = readmeContent.substring(endIndex, readmeContent.length)

    const bufferedText = Buffer.from(contentBefore + '\n' + newContent + '\n' + contentAfter)
    fs.writeFile(rootReadmePath, bufferedText, err => {
      if (err) throw err
      log.info('list-monorepo-packages', `${rootReadmePath} updated with new content!`)
    })
  })
}

module.exports = listMonorepoPackages
