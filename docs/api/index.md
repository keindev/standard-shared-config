# SharedConfig

Shared configuration manager

## Methods

### build

Build a shared configuration npm package structure.

#### Parameters

| Name         | Type     | Description             |
| :----------- | :------- | :---------------------- |
| `configPath` | `string` | Configuration file path |

### share

Create configuration files by shared config structure

#### Parameters

| Name                 | Type          | Description                             |
| :------------------- | :------------ | :-------------------------------------- |
| `sharedDir`          | `string`      | Package root directory to share configs |
| `options.scripts?`   | `IScript[]`   | List of package scripts                 |
| `options.snapshots?` | `ISnapshot[]` | Configuration files snapshots           |
