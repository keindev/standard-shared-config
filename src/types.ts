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

export enum PackageManager {
  NPM = 'npm',
  Yarn = 'yarn',
}

export const CONFIG_FILE = '.sharedconfig.yml';
export const SHARED_DIR = '.config';
export const OUTPUT_DIR = 'lib';

export type IMergeRule = string[] | null | boolean;
export type IScript = [string, string];
export type IDependency = [string, string | undefined];
export type IMergeMap = { [key: string]: IMergeRule };
export type IExtractionOptions = {
  /** Package devDependencies list */
  [EntityName.Dependencies]?: IDependency[];
  /** List of package scripts */
  [EntityName.Scripts]?: IScript[];
  /** Configuration files snapshots */
  [EntityName.Snapshots]?: ISnapshot[];
};

export interface ISnapshot {
  content: string;
  executable: boolean;
  hash: string;
  merge: IMergeRule;
  path: string;
  type: FileType;
}

export interface ISharedConfig {
  dependencies?: (string | { [key: string]: string })[];
  executableFiles?: string[];
  ignorePatterns?: { [key: string]: string[] };
  include?: string[];
  manager?: PackageManager;
  mergeRules?: IMergeMap;
  outputDir?: string;
  scripts?: { [key: string]: string };
  sharedDir?: string;
}

export interface INormalizedSharedConfig {
  dependencies: IDependency[];
  manager: PackageManager;
  outputDir: string;
  scripts: IScript[];
  sharedDir: string;
  snapshots: ISnapshot[];
}

export interface IExtractionConfig {
  ignoreDependencies?: string[];
  overrideScripts?: { [key: string]: string };
}

export interface INormalizedExtractionConfig {
  dependencies: IDependency[];
  scripts: IScript[];
}
