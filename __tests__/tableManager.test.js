'use strict';

const a5conf = require('../lib/conf')({
  table: {
    src: './__tests__/fixture/simple-table/**/*.yml',
    output: './.tmp/table-md'
  }
});
const tableManager = require('../lib/tableManager');

test('read table yml', () => {
  const actual = tableManager.readAll();
  expect(Object.keys(actual).length).toBe(2);
  expect(actual['table1'].id).toBe('table1');
  expect(actual['table2'].id).toBe('table2');
});
