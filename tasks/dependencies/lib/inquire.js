const inquirer = require('inquirer')

module.exports = ({message, choiceGroups}) => {
  const inquirerChoices = []

  choiceGroups.forEach(({name, choices}) => {
    inquirerChoices.push(new inquirer.Separator(name))
    choices.forEach(c => inquirerChoices.push(c))
  })

  return inquirer
    .prompt([
      {
        type: 'checkbox',
        message,
        name: 'boo',
        pageSize: 20,
        choices: inquirerChoices
      }
    ])
    .then(answers => answers.boo)
}
