# lerna-script-tasks-list-monorepo-pacakges

[lerna-script](../..) tasks for adding the list of your packages in desired location.

## install

```bash
npm install --save-dev lerna-script-tasks-list-monorepo-packages
```

## Usage

## API

### listMonorepoPackages({[packages]})(log): Promise

Task that collect all nested packages and creates the catalog for it in root README.md file if it has such content (replaces it with the results):

```
<!-- list-of-projects-marker START -->
<!-- list-of-projects-marker END -->
```

Parameters:

- packages - custom package list, or defaults as defined by `lerna.json`
- log - `npmlog` instance passed-in by `lerna-script`;
