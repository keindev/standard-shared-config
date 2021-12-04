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
| **dependencies**    | List of `devDependencies`, with the ability to specify the minimum required version in the `SemVer` format, which are required to work correctly with your shared configuration                                                                             |

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
dependencies:
  - '@types/jest'
  - '@typescript-eslint/eslint-plugin'
  - '@typescript-eslint/parser'
  - 'changelog-guru'
  - 'eslint'
  - 'husky': '6.x'
  - 'jest'
  - 'typescript': '4.x'
```

## Override `.sharedconfig.yml` configuration parameters

| Name                   | Description                                                                                                                                                                                   |
| :--------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **overrideScripts**    | Override values of package scripts defined in [`.sharedconfig.yml`](https://github.com/keindev/standard-shared-config/blob/master/docs/library-config.md) configuration of used shared config |
| **ignoreDependencies** | Ignore dependencies defined in [`.sharedconfig.yml`](https://github.com/keindev/standard-shared-config/blob/master/docs/library-config.md) configuration of used shared config                |

#### Example

##### .sharedconfig.yml - defined in my-shared-config package

```yaml
sharedDir: '.config'
outputDir: '.'

scripts:
  'prepare': 'husky install'
  'test': 'jest'
  'build': 'tsc'

dependencies:
  - '@types/jest'
  - '@typescript-eslint/eslint-plugin'
  - '@typescript-eslint/parser'
  - 'changelog-guru'
  - 'eslint'
  - 'husky': '6.x'
  - 'jest'
  - 'typescript': '4.x'
```

##### .sharedconfig.yml - defined in `sharedDir` (`.config` by default) of current package

```yaml
overrideScripts:
  'build': 'tsc --extendedDiagnostics'
# ignore this dependency from shared-config
ignoreDependencies: ['changelog-guru']
```
