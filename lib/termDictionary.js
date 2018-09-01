'use strict';

const extend = require('util')._extend;
const AppError = require('./errors');

/** 用語分類 */
const category = {
  TABLE: 'table',
};
module.exports.category = category;

/** 用語タイプ */
const type = {
  TABLE_NAME: 'table-name',
  TABLE_ID: 'table-id',
  COLUMN_NAME: 'column-name',
  COLUMN_ID: 'column-id',
};
module.exports.type = type;

/** 
 * 用語インデックス
 * 単語をキーにして、termオブジェクトを配列で保持する
 */
let termIndex = {};

function createTerm(options) {
  return extend({
    term: null,
    termType: null,
    termCategory: null,
    relation: {
      tableId: null,
      columnId: null,
    },
  }, options);
}

function clear() {
  termIndex = {};
}
module.exports.clear = clear;

function add(term) {
  const key = term.term;
  if (!termIndex[key]) {
    termIndex[key] = [];
  }
  termIndex[key].push(term);
}
module.exports.add = add;

function get(condition) {
  const results = list(condition);
  if (results.length === 1) {
    return results[0];
  }
  if (results.length === 0) {
    return null;
  }
  throw new AppError('not unique result. condition=' + JSON.stringify(condition));
}
module.exports.get = get;

function list(condition) {
  let index = {};
  if (condition.term) {
    if (!termIndex[condition.term]) {
      return [];
    }
    index[condition.term] = termIndex[condition.term];
  } else {
    index = termIndex;
  }
  const results = [];
  Object.keys(index).forEach((key) => {
    const terms = index[key];
    terms.forEach((term) => {
      if (matchTerm(condition, term)) {
        results.push(term);
      }
    });
  });
  return results;
}
module.exports.list = list;

function matchTerm(condition, term) {
  if (condition.term) {
    if (condition.term !== term.term) {
      return false;
    }
  }
  if (condition.termType) {
    if (condition.termType !== term.termType) {
      return false;
    }
  }
  if (condition.termCategory) {
    if (condition.termCategory !== term.termCategory) {
      return false;
    }
  }
  if (condition.relation) {
    if (condition.relation.tableId) {
      if (condition.relation.tableId !== term.relation.tableId) {
        return false;
      }
    }
    if (condition.relation.columnId) {
      if (condition.relation.columnId !== term.relation.columnId) {
        return false;
      }
    }
  }
  return true;
}

function addTables(tables) {
  Object.keys(tables).forEach(tableId => {
    const table = tables[tableId];
    addTable(tableId, table.name);
    Object.keys(table.fields).forEach((fieldId) => {
      const field = table.fields[fieldId];
      addColumn(table.id, fieldId, field.name);
    });
  });
}
module.exports.addTables = addTables;

/** テーブル名を追加する */
function addTable(id, name) {
  if (get({term: id, termType: type.TABLE_ID}) != null) {
    throw new AppError('テーブルIDが重複しています:' + id);
  }
  if (get({term: name, termType: type.TABLE_NAME}) != null) {
    throw new AppError('テーブル名が重複しています:' + name);
  }
  add(createTerm({
    term: id,
    termType: type.TABLE_ID,
    termCategory: category.TABLE,
    relation: {
      tableId: id,
    }
  }));
  add(createTerm({
    term: name,
    termType: type.TABLE_NAME,
    termCategory: category.TABLE,
    relation: {
      tableId: id,
    }
  }));
}

/**
 * カラム名を追加する
 */
function addColumn(tableId, columnId, name) {
  const condition = {
    relation:{
      tableId: tableId
    }
  };
  if (get(extend(condition, {term: columnId, termType: type.COLUMN_ID})) != null) {
    throw new AppError('カラムIDが重複しています:' + columnId);
  }
  if (get(extend(condition, {term: name, termType: type.COLUMN_NAME})) != null) {
    throw new AppError('カラム名が重複しています:' + name);
  }
  add(createTerm({
    term: columnId,
    termType: type.COLUMN_ID,
    termCategory: category.TABLE,
    relation: {
      tableId: tableId,
      columnId: columnId,
    }
  }));
  add(createTerm({
    term: name,
    termType: type.COLUMN_NAME,
    termCategory: category.TABLE,
    relation: {
      tableId: tableId,
      columnId: columnId,
    }
  }));
}
