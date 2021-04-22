<p align="center"><img width="400" src="https://cdn.jsdelivr.net/gh/keindev/standard-shared-config/media/logo.svg" alt="Standard shared config logo"></p>

<p align="center">
    <a href="https://github.com/keindev/standard-shared-config/actions"><img src="https://github.com/keindev/standard-shared-config/actions/workflows/build.yml/badge.svg" alt="Build Status"></a>
    <a href="https://codecov.io/gh/keindev/standard-shared-config"><img src="https://codecov.io/gh/keindev/standard-shared-config/branch/master/graph/badge.svg" /></a>
    <a href="https://www.npmjs.com/package/standard-shared-config"><img alt="npm" src="https://img.shields.io/npm/v/standard-shared-config.svg"></a>
    <a href="https://www.npmjs.com/package/standard-shared-config"><img alt="NPM" src="https://img.shields.io/npm/l/standard-shared-config.svg"></a>
</p>

One shared config to rule them all :loop::package:

> The configuration files is an important part of your project, and as such, you may want to share it with other projects or people. Shareable configs allow you to publish your configuration settings on npm and have others download and use it in their projects.

## Install

```console
npm install standard-shared-config
```

## Usage

### Create a shared configuration package

- Create `package.json` with `name`, `version` and `description`.
- Create `.config` directory and copy all the configuration files you want to share.
- Create `.sharedconfig.yml` - file containing schema and rules for your shared configuration and specify the [usage parameters](https://github.com/keindev/standard-shared-config/blob/master/docs/config.md).
- Run `shared-config build`

After completing the command execution, you will get the following structure inside the `outDir`:

- `bin/[you shared config name from package]`
- `dependencies.js` - List of `devDependencies`, see [`.sharedconfig.yml`](https://github.com/keindev/standard-shared-config/blob/master/docs/config.md)
- `scripts.js` - Script commands which will be added to the `package.json`, see [`.sharedconfig.yml`](https://github.com/keindev/standard-shared-config/blob/master/docs/config.md)
- `snapshots.js` - snapshots of config files from `rootDir`
- `index.js` - will be called when your config is applied to copy config files to the project

Now publish your shared configuration package to NPM!

### Use shared configuration

- install your shared configuration package
- add script with your shared configuration package name to `package.json` scripts for creating sharable configuration files:

```json
{
  "scripts": {
    "prepare:config": "my-shared-config",
    ...
  }
}
```

> Do not forget to add the shared configuration files in the `.gitignore`, because you no longer need them in the repository

## API

Read the [API documentation](https://github.com/keindev/standard-shared-config/blob/master/docs/api/index.md) for more information.

## License

[MIT](LICENSE)
