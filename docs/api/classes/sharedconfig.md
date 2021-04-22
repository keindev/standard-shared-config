# Class: SharedConfig

Shared configuration manager

## Table of contents

### Constructors

- [constructor](sharedconfig.md#constructor)

### Methods

- [build](sharedconfig.md#build)
- [share](sharedconfig.md#share)

## Constructors

### constructor

\+ **new SharedConfig**(): [*SharedConfig*](sharedconfig.md)

**Returns:** [*SharedConfig*](sharedconfig.md)

## Methods

### build

▸ **build**(`__namedParameters`: [*IBuildOptions*](../index.md#ibuildoptions)): *Promise*<void\>

Build a shared configuration npm package structure

#### Parameters:

| Name | Type |
| :------ | :------ |
| `__namedParameters` | [*IBuildOptions*](../index.md#ibuildoptions) |

**Returns:** *Promise*<void\>

___

### share

▸ **share**(`__namedParameters`: *Partial*<{ `dependencies`: IDependency[] ; `scripts`: IScript[] ; `snapshots`: ISnapshot[]  }\>): *Promise*<void\>

Create configuration files by shared config structure

#### Parameters:

| Name | Type |
| :------ | :------ |
| `__namedParameters` | *Partial*<{ `dependencies`: IDependency[] ; `scripts`: IScript[] ; `snapshots`: ISnapshot[]  }\> |

**Returns:** *Promise*<void\>
