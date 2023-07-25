<p align="center"><img src="https://cdn.jsdelivr.net/gh/tagproject/art/packages/standard-shared-config/banner.svg" alt="Package logo"></p>

<p align="center">
    <a href="https://github.com/keindev/standard-shared-config/actions"><img src="https://github.com/keindev/standard-shared-config/actions/workflows/build.yml/badge.svg" alt="Build Status"></a>
    <a href="https://codecov.io/gh/keindev/standard-shared-config"><img src="https://codecov.io/gh/keindev/standard-shared-config/branch/main/graph/badge.svg" /></a>
    <a href="https://www.npmjs.com/package/standard-shared-config"><img alt="npm" src="https://img.shields.io/npm/v/standard-shared-config.svg"></a>
    <a href="https://github.com/tagproject/ts-package-shared-config"><img src="https://img.shields.io/badge/standard--shared--config-nodejs%2Bts-green?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAfCAYAAACh+E5kAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJQSURBVHgB1VftUcMwDFU4/tMNyAZ0A7IBbBA2CExAmIBjApcJChO0TFA2SJkgMIGRyDNV3TSt26RN353OX/LHUyTZIdoB1tqMZcaS0imBDzxkeWaJWR51SX0HrJ6pdsJyifpdb4loq3v9A+1CaBuWMR0Q502DzuJRFD34Y9z3DXIRNy/QPWKZY27COlM6BtZZHWMJ3CkVa28KZMTJkDpCVLOhs/oL2gMuEhYpxeenPPah9EdczLkvpwZgnQHWnlNLiNQGYiWx5gu6Ehz4m+WNN/2i9Yd75CJmeRDXogbIFxECrqQ2wIvlLBOXaViuYbGQNSQLFSGZyOnulb2wadaGnyoSSeC8GBJkNDf5kloESAhy2gFIIPG2+ufUMtivn/gAEi+Gy4u6FLxh/qer8/xbLq7QlNh6X4mbtr+A3pylDI0Lb43YrmLmXP5v3a4I4ABDRSI4xjB/ghveoj4BCVm37JQADhGDgOA+YJ48TSaoOwKpt27aOQG1WRES3La65WPU3dysTjE8de0Aj8SsKS5sdS9lqCeYI08bU6d8EALYS5OoDW4c3qi2gf7f+4yODfj2DIcqdVzYKnMtEUO7RP2gT/W1AImxXSC3i7R7rfRuMT5G2xzSYzaCDzOyyzDeuNHZx1a3fOdJJwh28fRwwT1QY6Xzf7TvWG6ob/BIGPQ59ymUngRyRn2El6Fy5T7G0zl+JmoC3KRQXyT1xpfiJKIeAemzqBl6U3V5ocZNf4hHg61u223wn4nOqF8IzvF9IxCMkyfQ+i/lnnhlmW6h9+Mqv1SmQhehji4JAAAAAElFTkSuQmCC" alt="Standard Shared Config"></a>
</p>

Easy way to create and share your boilerplate configs. One shared config to rule them all:loop::package:

> The configuration files is an important part of your project, and as such, you may want to share it with other projects or people. Shareable configs allow you to publish your configuration settings on npm and have others download and use it in their projects.

## Install

```console
npm install standard-shared-config
```

## Usage

### Create a shared configuration package

- Create `package.json` with `name`, `version` and `description`.
- Create `.config` directory and copy all the configuration files you want to share.
- Create `.sharedconfig.yml` - file containing schema and rules for your shared configuration and specify the [usage parameters](docs/config.md).
- Run `shared-config build`

After completing the command execution, you will get the following structure inside the `outputDir`:

- `bin/[you shared config name from package]`
- `scripts.js` - Script commands which will be added to the `package.json`, see [`.sharedconfig.yml`](docs/config.md)
- `snapshots.js` - snapshots of config files from `sharedDir`
- `index.js` - will be called when your config is applied to copy config files to the project

Now publish your shared configuration package to NPM!

### Use shared configuration

- install your shared configuration package
- add script with your shared configuration package name to `package.json` scripts for creating sharable configuration files.
- override parts of config files in `sharedDir`, if needed (`.config` by default)
- override package scripts in [`.sharedconfig.yml`](docs/config.md) in `sharedDir`, if needed (`.config` by default)

```json
{
  "scripts": {
    "prepare:config": "my-shared-config"
  }
}
```

> Do not forget to add the shared configuration files in the `.gitignore`, because you no longer need them in the repository

## API

Read the [API documentation](docs/api/index.md) for more information.
