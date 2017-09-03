# lerna-script-tasks-depcheck

[lerna-script](../..) task that:
 - runs depcheck for all modules.

## install

```bash
npm install --save-dev lerna-script-tasks-depcheck
```

## API

### ({[packages]})(log): Promise
Run depcheck for all modules incrementally.

Parameters:
 - packages - list of packages to generate idea project for or defaults to ones defined in `lerna.json`;
 - log - `npmlog` instance.
