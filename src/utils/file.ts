import crypto from 'crypto';
import { constants, promises as fs } from 'fs';
import path from 'path';
import strip from 'strip-comments';

import { FileType } from '../types';

export const readFile = async (filePath: string): Promise<string | undefined> => {
  const isExists = await fs
    .access(filePath, constants.R_OK)
    .then(() => true)
    .catch(() => false);
  let content: string | undefined;

  if (isExists) content = await fs.readFile(filePath, 'utf8');

  return content ? strip(content) : undefined;
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

export const writeFile = async (filePath: string, data: string | string[]): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, Array.isArray(data) ? data.join('\n') : data);
};
