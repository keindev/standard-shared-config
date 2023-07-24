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
  Package = 'package',
}

export type IMergeRule = string[] | null | boolean;
export type IScript = [string, string];
export type IDependency = [string, string | undefined];
export type IMergeMap = { [key: string]: IMergeRule };

export interface ISnapshot {
  content: string;
  executable: boolean;
  hash: string;
  merge: IMergeRule;
  path: string;
  type: FileType;
}
