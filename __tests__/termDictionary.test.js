'use strict';

const a5conf = require('../lib/conf')({
  table: {
    src: './__tests__/fixture/simple-table/**/*.yml',
    output: './.tmp/table-md'
  }
});
const tableManager = require('../lib/tableManager');
const termDictionary = require('../lib/termDictionary');

test('用語辞書にテーブル定義を追加', () => {
  const tables = tableManager.readAll();
  termDictionary.clear();
  termDictionary.addTables(tables);
  expect(termDictionary.get({
    term:'table1',
    termType:termDictionary.type.TABLE_ID
  })).toEqual({
    term: 'table1',
    termType: termDictionary.type.TABLE_ID,
    termCategory: termDictionary.category.TABLE,
    relation: {
      tableId: 'table1',
    },
  });
  expect(termDictionary.get({
    term:'テーブル1',
    termType:termDictionary.type.TABLE_NAME
  })).toEqual({
    term: 'テーブル1',
    termType: termDictionary.type.TABLE_NAME,
    termCategory: termDictionary.category.TABLE,
    relation: {
      tableId: 'table1',
    },
  });
  expect(termDictionary.get({
    term:'column1',
    termType:termDictionary.type.COLUMN_ID
  })).toEqual({
    term: 'column1',
    termType: termDictionary.type.COLUMN_ID,
    termCategory: termDictionary.category.TABLE,
    relation: {
      tableId: 'table1',
      columnId: 'column1',
    },
  });
  expect(termDictionary.get({
    term:'カラム1',
    termType:termDictionary.type.COLUMN_NAME
  })).toEqual({
    term: 'カラム1',
    termType: termDictionary.type.COLUMN_NAME,
    termCategory: termDictionary.category.TABLE,
    relation: {
      tableId: 'table1',
      columnId: 'column1',
    },
  });
  expect(termDictionary.get({
    term:'table2',
    termType:termDictionary.type.TABLE_ID
  })).not.toBeNull();
  expect(termDictionary.get({
    term:'column2',
    termType:termDictionary.type.COLUMN_ID
  })).not.toBeNull();
  expect(termDictionary.get({
    term:'カラム2',
    termType:termDictionary.type.COLUMN_NAME
  })).not.toBeNull();
  expect(termDictionary.get({
    term:'column21',
    termType:termDictionary.type.COLUMN_ID
  })).not.toBeNull();
  expect(termDictionary.get({
    term:'カラム21',
    termType:termDictionary.type.COLUMN_NAME
  })).not.toBeNull();
});

test('テーブル定義の重複定義のチェック', () => {
  const tables = tableManager.readAll();
  termDictionary.clear();
  termDictionary.addTables(tables);
  expect(() => {
    termDictionary.addTables({
      'table1': {
        id: 'table1',
        name: 'XXXX',
        fields: {
          column1: {
            name: 'カラムX'
          }
        }
      }
    });
  }).toThrow();
  expect(() => {
    termDictionary.addTables({
      'tableXX': {
        id: 'tableXX',
        name: 'テーブル1',
        fields: {
          column1: {
            name: 'カラムX'
          }
        }
      }
    });
  }).toThrow();
  expect(() => {
    termDictionary.addTables({
      'table100': {
        id: 'table100',
        name: 'テーブル100',
        fields: {
          column100: {
            name: 'カラム100'
          },
          column101: {
            name: 'カラム100'
          }
        }
      }
    });
  }).toThrow();
});