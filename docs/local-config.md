# .sharedconfig.yml configuration parameters

| Name                   | Description                                                                                                                                                                                   |
| :--------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **overrideScripts**    | Override values of package scripts defined in [`.sharedconfig.yml`](https://github.com/keindev/standard-shared-config/blob/master/docs/library-config.md) configuration of used shared config |
| **ignoreDependencies** | Ignore dependencies defined in [`.sharedconfig.yml`](https://github.com/keindev/standard-shared-config/blob/master/docs/library-config.md) configuration of used shared config                |

#### Example

##### .sharedconfig.yml - defined in my-shared-config package

```yaml
rootDir: '.config'
outDir: '.'

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

##### .sharedconfig.override.yml - defined in `rootDir` (`.config` by default) of current package

```yaml
overrideScripts:
  'build': 'tsc --extendedDiagnostics'
# ignore this dependency from shared-config
ignoreDependencies: ['changelog-guru']
```
