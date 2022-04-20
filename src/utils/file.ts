import crypto from 'crypto';
import { constants, promises as fs } from 'fs';
import glob from 'glob';
import path from 'path';

import { FileType, IMergeRule, ISharedConfig, ISnapshot } from '../types.js';
import { merge, parse, stringify } from './json.js';

enum FileMode {
  Default = 0o0666,
  Executable = 0o0755,
}

const GLOB_OPTIONS = { dot: true, strict: true, nodir: true, ignore: ['**/.sharedconfig.yml'] };

export const readFile = async (filePath: string): Promise<string | undefined> => {
  const isExists = await fs
    .access(filePath, constants.R_OK)
    .then(() => true)
    .catch(() => false);
  let content: string | undefined;

  if (isExists) content = await fs.readFile(filePath, 'utf8');

  return content;
};

export const getHash = (data: string): string => {
  const hash = crypto.createHash('sha256');

  return hash.update(data, 'utf8').digest('hex');
};

export const getType = (filePath: string): FileType => {
  const extname = path.extname(filePath);
  const normalizedExtname = extname.substring(1).toLowerCase();
  let type;

  switch (true) {
    case normalizedExtname === 'json':
      type = FileType.JSON;
      break;
    case ['yaml', 'yml'].includes(normalizedExtname):
      type = FileType.YAML;
      break;
    case /\.[a-z]+ignore/i.test(path.basename(filePath, extname)):
      type = FileType.GLOB;
      break;
    default:
      type = FileType.Text;
      break;
  }

  return type;
};

export const writeFile = async (filePath: string, data: string | string[], executable = false): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, Array.isArray(data) ? data.join('\n') : data, {
    mode: executable ? FileMode.Executable : FileMode.Default,
  });
};

export const createSnapshot = async (
  filePath: string,
  sharedDir: string,
  mergeRules: Map<string, IMergeRule>,
  executableFiles: Set<string>
): Promise<ISnapshot> => {
  const content = (await readFile(filePath)) ?? '';
  const relativePath = path.relative(sharedDir, filePath);
  const type = getType(filePath);
  const rule = mergeRules.get(relativePath);

  return {
    path: relativePath,
    hash: getHash(content),
    merge: [FileType.GLOB, FileType.Text].includes(type) && rule ? true : rule ?? false,
    executable: executableFiles.has(relativePath),
    type,
    content,
  };
};

export const createSnapshots = async (
  dir: string,
  config: Pick<ISharedConfig, 'include' | 'mergeRules' | 'executableFiles' | 'ignorePatterns'>
): Promise<ISnapshot[]> => {
  const files = (config.include ?? ['**/*']).map(pattern => glob.sync(`${dir}/${pattern}`, GLOB_OPTIONS)).flat();
  const mergeRules = new Map(
    Object.entries(config.mergeRules ?? {}).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) acc.push([key, value.filter(item => typeof item === 'string')]);
      if (value === null) acc.push([key, !value]);
      if (typeof value === 'boolean') acc.push([key, value]);

      return acc;
    }, [] as [string, IMergeRule][])
  );
  const executableFiles = new Set(config.executableFiles ?? []);
  const snapshots = await Promise.all(
    files
      .sort((a, b) => b.split('/').length - a.split('/').length || a.localeCompare(b))
      .map(filePath => createSnapshot(filePath, dir, mergeRules, executableFiles))
  );

  return [
    ...snapshots,
    ...Object.entries(config.ignorePatterns ?? {}).map(([filePath, rows]) => {
      const content = rows.join('\n');

      return {
        path: filePath,
        hash: getHash(content),
        merge: !!mergeRules.get(filePath),
        executable: executableFiles.has(filePath),
        type: FileType.GLOB,
        content,
      };
    }),
  ];
};

export const mergeFiles = ({ type, merge: rules, content: snapshot }: ISnapshot, content: string): string => {
  const excludes = Array.isArray(rules) ? new Set(rules) : undefined;
  let result;

  switch (type) {
    case FileType.GLOB:
      result = [...new Set([...content.split('\n'), ...snapshot.split('\n')].filter(Boolean)).values()]
        .sort()
        .join('\n');
      break;
    case FileType.JSON:
    case FileType.YAML:
      result = stringify(merge({ left: parse(content, type), right: parse(snapshot, type), excludes }), type);
      break;
    case FileType.Text:
    default:
      result = content;
      break;
  }

  return result;
};
