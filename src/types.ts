export enum FileType {
  Text = 'text',
  GLOB = 'glob',
  JSON = 'json',
  YAML = 'yaml',
}

export enum EntityName {
  Dependencies = 'dependencies',
  Scripts = 'scripts',
  Snapshots = 'snapshots',
}

export type IMergeRule = string[] | boolean;
export type IScript = [string, string];
export type IDependency = [string, string | undefined];

export interface ISnapshot {
  path: string;
  hash: string;
  merge: IMergeRule;
  type: FileType;
  content: string;
}
