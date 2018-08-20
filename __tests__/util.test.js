'use strict';

const util = require('../lib/util');

test('findFilesGlob', () => {
  const pattern = './__tests__/fixture/simple-table/**/table[12].yml';
  let actual = util.findFilesGlob(pattern);
  expect(actual).toContain('./__tests__/fixture/simple-table/table1.yml');
  expect(actual).toContain('./__tests__/fixture/simple-table/sub/table2.yml');
  expect(actual.length).toBe(2);
  actual = util.findFilesGlob([pattern]);
  expect(actual.length).toBe(2);
});
