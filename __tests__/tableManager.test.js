'use strict';

const a5conf = require('../lib/conf')({
  tableFinder: './__tests__/data/tableManager/**/*.yml'
});
const tableManager = require('../lib/tableManager');

test('read table yml', () => {
  expect(tableManager.all()).toEqual({
    table1: {
      id: 'table1'
    },
    table2: {
      id: 'table2'
    }
  });
});
