'use strict';

const tableManager = require('../lib/tableManager');
const termDictionary = require('../lib/termDictionary');

test('termDictionary', () => {
  const tables = tableManager.all();
  termDictionary.addTables(tables);
  let actual = termDictionary.get({
    term:'m_customer',
    termType:termDictionary.type.TABLE_ID
  });
  expect(actual).toEqual({
    term: 'm_customer',
    termType: termDictionary.type.TABLE_ID,
    termCategory: termDictionary.category.TABLE,
    relation: {
      tableId: 'm_customer',
    },
  });
  actual = termDictionary.get({
    term:'顧客',
    termType:termDictionary.type.TABLE_NAME
  });
  expect(actual).toEqual({
    term: '顧客',
    termType: termDictionary.type.TABLE_NAME,
    termCategory: termDictionary.category.TABLE,
    relation: {
      tableId: 'm_customer',
    },
  });
  actual = termDictionary.get({
    term:'cust_email',
    termType:termDictionary.type.COLUMN_ID
  });
  expect(actual).toEqual({
    term: 'cust_email',
    termType: termDictionary.type.COLUMN_ID,
    termCategory: termDictionary.category.TABLE,
    relation: {
      tableId: 'm_customer',
      columnId: 'cust_email',
    },
  });
  actual = termDictionary.get({
    term:'顧客メールアドレス',
    termType:termDictionary.type.COLUMN_NAME
  });
  expect(actual).toEqual({
    term: '顧客メールアドレス',
    termType: termDictionary.type.COLUMN_NAME,
    termCategory: termDictionary.category.TABLE,
    relation: {
      tableId: 'm_customer',
      columnId: 'cust_email',
    },
  });
});
