# Shared config

## `.sharedconfig.yml` configuration parameters

| Name                | Description                                                                                                                                                                                                                                                 |
| :------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **sharedDir**       | Directory with shared configuration files, `.config` by default                                                                                                                                                                                             |
| **outputDir**       | Output directory, `process.cwd` by default.                                                                                                                                                                                                                 |
| **include**         | Specifies a list of glob patterns that match files to be included                                                                                                                                                                                           |
| **mergeRules**      | List of configuration rules for merging. If you need to override or add a property inside a json or yaml file, you should specify the file name and path to the property separated by a dot. For files with `glob` patterns, like `.gitignore` - only name. |
| **ignorePatterns**  | List of ignore patters files, like `.gitignore`                                                                                                                                                                                                             |
| **executableFiles** | List of files to be executable (`chmod 0755`)                                                                                                                                                                                                               |
| **scripts**         | Script commands like in `package.json`, which will be added to the `package.json` file of the package using your shared config                                                                                                                              |

| **package.exports** | Standard entry points of the package, with enhanced support for ECMAScript Modules. configuration |
| **package.manager** | Default package manager `npm` or `yarn` |
| **package.type** | [Resolution algorithm](https://nodejs.org/api/esm.html#esm_package_json_type_field) for importing `.js` files from packages scope. |
| **package.types** | Location of the bundled TypeScript declaration file. |

#### Example

```yaml
sharedDir: '.config'
outputDir: '.'
mergeRules:
  # Rule for merging `paths` in .eslintrc configuration
  # "settings": {
  #   "import/resolver": {
  #     "node": {
  #       "paths": ["src"]
  #     }
  #   }
  # }
  '.eslintrc': ['settings.import/resolver.node.paths']
  '.vscode/launch.json': ['configurations']
  '.gitignore':
  '.husky/commit-msg': true
ignorePatterns:
  '.gitignore': ['.env', '.vscode/', 'node_modules/']
executableFiles: ['.husky/commit-msg']
scripts:
  'prepare': 'husky install'
  'test': 'jest'
  'build': 'tsc --extendedDiagnostics'
```

## Shared `dev` dependencies

To define a list of shared dependencies, use [peerDependencies](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#peerdependencies) in package.json.

> As of `npm` `v7`, `peerDependencies` are installed by **_default_**.

## Override `.sharedconfig.yml` configuration parameters

| Name                | Description                                                                                           |
| :------------------ | ----------------------------------------------------------------------------------------------------- |
| **overrideScripts** | Override values of package scripts defined in `.sharedconfig.yml` configuration of used shared config |

#### Example

##### .sharedconfig.yml - defined in my-shared-config package

```yaml
sharedDir: '.config'
outputDir: '.'

scripts:
  'prepare': 'husky install'
  'test': 'jest'
  'build': 'tsc'
```

##### .sharedconfig.yml - defined in `sharedDir` (`.config` by default) of current package

```yaml
overrideScripts:
  'build': 'tsc --extendedDiagnostics'
```
