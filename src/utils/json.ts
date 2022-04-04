import isEqual from 'lodash.isequal';
import unionWith from 'lodash.unionwith';
import { JSONValue } from 'package-json-helper/lib/types';
import yaml from 'yaml';

export type IParserType = 'json' | 'yaml';
export type IMergeOptions = {
  excludes?: Set<string>;
  left?: JSONValue;
  path?: (string | number)[];
  right?: JSONValue;
};

export const parse = (str: string, type?: IParserType): JSONValue => {
  const isJSON = !type || type === 'json';

  return isJSON ? JSON.parse(str) : yaml.parse(str);
};

export const stringify = (value: JSONValue, type?: IParserType): string => {
  const isJSON = !type || type === 'json';

  return isJSON ? JSON.stringify(value, undefined, 2) : yaml.stringify(value);
};

export const merge = ({ left, right, excludes = new Set<string>(), path = [] }: IMergeOptions): JSONValue => {
  const isMerge = excludes.delete(path.join('.'));
  let result = isMerge ? left ?? right : right ?? left;

  if (typeof right === 'object' && typeof left === 'object' && right !== null && left !== null) {
    if (Array.isArray(right) && Array.isArray(left)) {
      result = isMerge
        ? unionWith(right, left, isEqual)
        : right.map((value, index) => merge({ left: left[index], right: value, excludes, path: [...path, index] }));
    }

    if (!Array.isArray(right) && !Array.isArray(left)) {
      result = Object.entries(right).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: merge({ left: left[key], right: value, excludes, path: [...path, key] }),
        }),
        isMerge ? left : {}
      );
    }
  }

  return result ?? null;
};
