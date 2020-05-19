# lerna-script-tasks-npmfix

[lerna-script](../..) task that:

- updates 'homepage' `package.json` value to location in repo for existing github `origin` remote;
- updates 'repository' `package.json` value to location in repo for existing github `origin` remote;

## install

```bash
npm install --save-dev lerna-script-tasks-npmfix
```

## API

### ({[packages]})(log): Promise

Updates `homepage`, `repository` urls for `packages`.

Parameters:

- packages - list of packages to generate idea project for or defaults to ones defined in `lerna.json`;
- log - `npmlog` instance.
