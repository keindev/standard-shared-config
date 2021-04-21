import { promises as fs } from 'fs';

import { FileType } from '../../types';
import { getFileContent, getFileHash, getFileType } from '../../utils/file';

const FILE_CONTENT = `
// Comment 1
# Comment 2
/* Comment 3 */
test: true
`;

jest.spyOn(fs, 'access').mockImplementation(() => Promise.resolve());
jest.spyOn(fs, 'readFile').mockImplementation(() => Promise.resolve(FILE_CONTENT));

describe('File utils', () => {
  it('Get file content', async () => {
    const content = await getFileContent('path');

    expect(content).toBe('\n\n# Comment 2\ntest: true\n');
  });

  it('Get file hash', () => {
    expect(getFileHash(FILE_CONTENT)).toMatchSnapshot();
  });

  it('Get file type', () => {
    expect(getFileType('.gitignore')).toBe(FileType.GLOB);
    expect(getFileType('test.json')).toBe(FileType.JSON);
    expect(getFileType('test')).toBe(FileType.Text);
    expect(getFileType('test.yaml')).toBe(FileType.YAML);
    expect(getFileType('test.yml')).toBe(FileType.YAML);
  });
});
