import { IDependency, IMergeMap, IScript, ISnapshot } from './base.js';
import { INormalizedPackageParams, IPackageParams } from './package.js';

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

export interface INormalizedExtractionConfig {
  dependencies: IDependency[];
  package: INormalizedPackageParams;
  scripts: IScript[];
}
