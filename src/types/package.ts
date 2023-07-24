import { ExportMap } from 'package-json-helper';
import { JSONValue } from 'package-json-helper/types/base';
import { ManagerType, PackageType } from 'package-json-helper/types/package';

export interface IPackageParams {
  exports?: JSONValue;
  manager?: ManagerType;
  peerDependencies?: Record<string, string>;
  type?: PackageType;
  types?: string;
}

export interface INormalizedPackageParams extends Pick<IPackageParams, 'manager' | 'type' | 'types'> {
  exports?: ExportMap;
  peerDependencies?: Record<string, string>;
}
