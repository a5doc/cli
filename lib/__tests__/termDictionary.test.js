'use strict';

const path = require('path');
const fixtureDir = (path.resolve('')+'/lib/__tests__/fixture').replace(/\\/g, '/');;
const outtmpDir = (path.resolve('')+'/.tmp').replace(/\\/g, '/');

const a5conf = require('../conf');
a5conf._extend({
  table: {
    src: fixtureDir+'/simple-table/**/*.yml',
    tableMdDir: outtmpDir+'/table-md',
  }
});

const tableManager = require('../tableManager');
const termDictionary = require('../termDictionary');

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
    term:'column21',
    termType:termDictionary.type.COLUMN_ID
  })).toEqual({
    term: 'column21',
    termType: termDictionary.type.COLUMN_ID,
    termCategory: termDictionary.category.TABLE,
    relation: {
      tableId: 'table2',
      columnId: 'column21',
    },
  });
  expect(termDictionary.get({
    term:'カラム21',
    termType:termDictionary.type.COLUMN_NAME
  })).toEqual({
    term: 'カラム21',
    termType: termDictionary.type.COLUMN_NAME,
    termCategory: termDictionary.category.TABLE,
    relation: {
      tableId: 'table2',
      columnId: 'column21',
    },
  });
  expect(termDictionary.list({
    term:'column1',
    termType:termDictionary.type.COLUMN_ID
  })).toEqual([{
    term: 'column1',
    termType: termDictionary.type.COLUMN_ID,
    termCategory: termDictionary.category.TABLE,
    relation: {
      tableId: 'table1',
      columnId: 'column1',
    },
  },{
    term: 'column1',
    termType: termDictionary.type.COLUMN_ID,
    termCategory: termDictionary.category.TABLE,
    relation: {
      tableId: 'table3',
      columnId: 'column1',
    },
  }]);
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