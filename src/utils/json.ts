import isEqual from 'lodash.isequal';
import unionWith from 'lodash.unionwith';
import { JsonValue } from 'type-fest';
import yaml from 'yaml';

export type IParserType = 'json' | 'yaml';
export type IMergeOptions = {
  left?: JsonValue;
  right?: JsonValue;
  excludes?: Set<string>;
  path?: (string | number)[];
};

export const parse = (str: string, type?: IParserType): JsonValue => {
  const isJSON = !type || type === 'json';

  return isJSON ? JSON.parse(str) : yaml.parse(str);
};

export const stringify = (value: JsonValue, type?: IParserType): string => {
  const isJSON = !type || type === 'json';

  return isJSON ? JSON.stringify(value, undefined, 2) : yaml.stringify(value);
};

export const merge = ({ left, right, excludes = new Set<string>(), path = [] }: IMergeOptions): JsonValue => {
  const isMerge = excludes.delete(path.join('.'));
  let result = isMerge ? left : right;

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
