# lerna-script-tasks-depcheck

[lerna-script](../..) task that:
 - runs [depcheck](https://github.com/depcheck/depcheck) for all modules.

## install

```bash
npm install --save-dev lerna-script-tasks-depcheck
```

## API

### ({[packages], [depcheck]})(log): Promise
Run depcheck for all modules incrementally.

Parameters:
 - packages - list of packages to to run depcheck for or defaults to ones defined in `lerna.json`;
 - depcheck - options for [depcheck](https://github.com/depcheck/depcheck) task.
 - log - `npmlog` instance.
