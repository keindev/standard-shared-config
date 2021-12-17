import { ExportMap } from 'package-json-helper/lib/fields/ExportMap';
import { JSONValue, PackageManager, PackageType } from 'package-json-helper/lib/types';

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

export const CONFIG_FILE = '.sharedconfig.yml';
export const SHARED_DIR = '.config';
export const OUTPUT_DIR = 'lib';

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

export interface IPackageParams {
  exports?: JSONValue;
  manager?: PackageManager;
  type?: PackageType;
  types?: string;
}

export interface ISharedConfig {
  dependencies?: (string | { [key: string]: string })[];
  executableFiles?: string[];
  ignorePatterns?: { [key: string]: string[] };
  include?: string[];
  mergeRules?: IMergeMap;
  outputDir?: string;
  package?: IPackageParams;
  scripts?: { [key: string]: string };
  sharedDir?: string;
}

export interface INormalizedSharedConfig {
  dependencies: IDependency[];
  outputDir: string;
  package: IPackageParams;
  scripts: IScript[];
  sharedDir: string;
  snapshots: ISnapshot[];
}

export interface IExtractionConfig {
  ignoreDependencies?: string[];
  overrideScripts?: { [key: string]: string };
}

export interface INormalizedPackageParams extends Pick<IPackageParams, 'manager' | 'type' | 'types'> {
  exports?: ExportMap;
}

export interface INormalizedExtractionConfig {
  dependencies: IDependency[];
  package: INormalizedPackageParams;
  scripts: IScript[];
}

export interface IExtractionOptions {
  /** Package devDependencies list */
  [EntityName.Dependencies]?: IDependency[];
  /** Package parameters */
  [EntityName.Package]?: IPackageParams;
  /** List of package scripts */
  [EntityName.Scripts]?: IScript[];
  /** Configuration files snapshots */
  [EntityName.Snapshots]?: ISnapshot[];
}
