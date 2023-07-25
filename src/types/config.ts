import { IMergeMap, IScript, ISnapshot } from './base.js';
import { INormalizedPackageParams, IPackageParams } from './package.js';

export interface ISharedConfig {
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
  outputDir: string;
  package: IPackageParams;
  scripts: IScript[];
  sharedDir: string;
  snapshots: ISnapshot[];
}

export interface IExtractionConfig {
  overrideScripts?: { [key: string]: string };
}

export interface INormalizedExtractionConfig {
  package: INormalizedPackageParams;
  scripts: IScript[];
}
