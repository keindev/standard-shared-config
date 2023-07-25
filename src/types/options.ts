import { EntityName, IScript, ISnapshot } from './base.js';
import { IPackageParams } from './package.js';

export interface IExtractionOptions {
  /** Package parameters */
  [EntityName.Package]?: IPackageParams;
  /** List of package scripts */
  [EntityName.Scripts]?: IScript[];
  /** Configuration files snapshots */
  [EntityName.Snapshots]?: ISnapshot[];
}
