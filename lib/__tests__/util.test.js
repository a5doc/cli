'use strict';

const util = require(__dirname+'/../util');
const path = require('path');
const fixtureDir = (__dirname+'/fixture').replace(/\\/g, '/');

test('findFilesGlob', () => {
  const pattern = fixtureDir + '/simple-table/**/table[12].yml';
  let actual = util.findFilesGlob(pattern);
  expect(actual).toContain(fixtureDir + '/simple-table/table1.yml');
  expect(actual).toContain(fixtureDir + '/simple-table/sub/table2.yml');
  expect(actual.length).toBe(2);
  actual = util.findFilesGlob([pattern]);
  expect(actual.length).toBe(2);
});

test('findFilesGlob not', () => {
  let actual = util.findFilesGlob([
    fixtureDir + '/simple-table/**/table[12].yml',
    '!' + fixtureDir + '/simple-table/**/table2.yml',
  ]);
  expect(actual).toContain(fixtureDir + '/simple-table/table1.yml');
  expect(actual.length).toBe(1);
});
