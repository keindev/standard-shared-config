import { promises as fs } from 'fs';

import { FileType } from '../../types';
import { getHash, getType, readFile } from '../../utils/file';

const FILE_CONTENT = `
// Comment 1
# Comment 2
/* Comment 3 */
test: true
`;

jest.spyOn(fs, 'access').mockImplementation(() => Promise.resolve());
jest.spyOn(fs, 'chmod').mockImplementation(() => Promise.resolve());
jest.spyOn(fs, 'readFile').mockImplementation(() => Promise.resolve(FILE_CONTENT));

describe('File utils', () => {
  it('Get file content', async () => {
    const content = await readFile('path');

    expect(content).toBe(FILE_CONTENT);
  });

  it('Get file hash', () => {
    expect(getHash(FILE_CONTENT)).toMatchSnapshot();
  });

  it('Get file type', () => {
    expect(getType('.gitignore')).toBe(FileType.GLOB);
    expect(getType('test.json')).toBe(FileType.JSON);
    expect(getType('test')).toBe(FileType.Text);
    expect(getType('test.yaml')).toBe(FileType.YAML);
    expect(getType('test.yml')).toBe(FileType.YAML);
  });
});
