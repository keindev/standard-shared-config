# .sharedconfig.yml configuration parameters

| Name             | Description                                                                                                                                                                                                                                                 |
| :--------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **rootDir**      | Directory with shared configuration files, `.config` by default                                                                                                                                                                                             |
| **outDir**       | Output directory, `process.cwd` by default.                                                                                                                                                                                                                 |
| **include**      | Specifies a list of glob patterns that match files to be included                                                                                                                                                                                           |
| **rules**        | List of configuration rules for merging. If you need to override or add a property inside a json or yaml file, you should specify the file name and path to the property separated by a dot. For files with `glob` patterns, like `.gitignore` - only name. |
| **scripts**      | Script commands like in `package.json`, which will be added to the `package.json` file of the package using your shared config                                                                                                                      |
| **dependencies** | List of `devDependencies`, with the ability to specify the minimum required version in the `SemVer` format, which are required to work correctly with your shared configuration                                                                             |

#### Example

```yaml
rootDir: '.config'
outDir: '.'
include: ['.github/**/*']

rules:
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
  # Merge glob patterns line by line
  '.gitignore':
  '.npmignore': true

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
