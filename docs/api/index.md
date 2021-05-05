# standard-shared-config

## Table of contents

### References

- [default](index.md#default)

### Classes

- [SharedConfig](classes/sharedconfig.md)

### Type aliases

- [IBuildOptions](index.md#ibuildoptions)
- [IShareOptions](index.md#ishareoptions)

## References

### default

Renames and exports: [SharedConfig](classes/sharedconfig.md)

## Type aliases

### IBuildOptions

Ƭ **IBuildOptions**: *object*

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `conf?` | *string* | Configuration file path |

___

### IShareOptions

Ƭ **IShareOptions**: *object*

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `dependencies?` | IDependency[] | Package devDependencies list |
| `scripts?` | IScript[] | List of package scripts |
| `snapshots?` | ISnapshot[] | Configuration files snapshots |
