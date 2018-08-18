'use strict';

const util = require('../lib/util');

test('findFilesGlob', () => {
  const pattern = './__tests__/data/tableManager/**/*.yml';
  let actual = util.findFilesGlob(pattern);
  expect(actual).toContain('./__tests__/data/tableManager/table1.yml');
  expect(actual).toContain('./__tests__/data/tableManager/sub/table2.yml');
  expect(actual.length).toBe(2);
  actual = util.findFilesGlob([pattern]);
  expect(actual.length).toBe(2);
});
