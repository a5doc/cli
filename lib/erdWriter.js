'use strict';

const extend = require('util')._extend;
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const ejs = require('ejs');
const a5conf = require('./conf');
const a5util = require('./util');
const AppError = require('./errors');
const mdTableFormatter = require('./util/mdTableFormatter');
const mdUtil = require('./util/mdUtil');
const tableManager = require('./tableManager');

/**
 * ERDの全mdを出力する.
 * a5doc.ymlに設定されているERDの出力全種類の出力。
 */
function writeAll() {
  const conf = a5conf.get();
  if (!conf.table.erd) {
    return;
  }
  const templateText = fs.readFileSync(__dirname + '/../template/erd.md', 'utf8');
  const ejsTemplate = ejs.compile(templateText, {});
  conf.table.erd.forEach((erd) => {
    fs.mkdirsSync(path.dirname(erd.path));
    writeErd(erd, ejsTemplate);
  });
}
module.exports.writeAll = writeAll;

/**
 * ERDの定義にもとづいてmdを出力する.
 */
function writeErd(erd, ejsTemplate) {
  // テーブル定義の内容をレンダリング
  const mdText = ejsTemplate(crteateErdRenderData(erd));
  fs.writeFileSync(erd.path, mdUtil.fixes(mdText));
}

function crteateErdRenderData(erd) {
  const tables = tableManager.readAll();
  // ドキュメントの表
  const docHeadRows = [
    ['ドキュメント', 'ドキュメントID', '表示グループ名'],
    ['ER図', erd.id, erd.docTitle],
  ];
  // ERDに出力する対象のエンティティを作成
  const entities = {};
  erd.entityPatterns.forEach((entityPattern) => {
    const re = new RegExp(entityPattern.id);
    Object.keys(tables).forEach((tableId) => {
      const table = tables[tableId];
      if (!table.id.match(re)) {
        return;
      }
      entities[tableId] = createEntity(erd, entityPattern, table);
    });
  });
  // relationshipを作成
  // 図中に登場するテーブルでFKの設定で関連づいたもので
  // 関連式を作成する
  const relationshipRows = Object.values(entities)
    .filter((entity) => {
      return entity.table.foreignKeys;
    })
    .reduce((rows, entity, index, array) => {
      Object.values(entity.table.foreignKeys).forEach((fk) => {
        const relationship = tableManager.getForeignKey(entity.table, fk.id);
        if (!entities[relationship.refTable.id]) {
          return;
        }
        rows.push(
          getEntityName(erd, entity.table)
          + ' ' 
          + cardinalityArrow(entity, relationship.foreignKey)
          + ' ' 
          + getEntityName(erd, relationship.refTable)
        );
      });
      return rows;
    }, []);
  return {
    erd: erd,
    docHead: mdTableFormatter.format(docHeadRows),
    entities: Object.values(entities),
    relationshipRows: relationshipRows,
  };
}

const cardinalityMap = {
  '1:': ' ',
  ':1': ' ',
  '11:': '||',
  ':11': '||',
  '01:': '|o',
  ':01': 'o|',
  'N:': '}',
  ':N': '{',
  '1N:': '}|',
  ':1N': '|{',
  '0N:': '}o',
  ':0N': 'o{',
};

function cardinalityArrow(entity, foreignKey) {
  const pair = foreignKey.relationType.split(/:/);
  do {
    if (pair.length !== 2) {
      break;
    }
    const left = pair[0]+':';
    const right = ':'+pair[1];
    if (!cardinalityMap[left] || !cardinalityMap[right]) {
      break;
    }
    return (cardinalityMap[left] + '--' + cardinalityMap[right]).trim();
  } while (false);
  throw new AppError(
    'relationTypeが不明です'
    + ': table=' + entity.table.id
    + ', fk=' + foreignKey.id
    + ', relationType=' + foreignKey.relationType
  );
}

function createEntity(erd, entityPattern, table) {
  return {
    entityName: getEntityName(erd, table),
    table: table,
    columnType: entityPattern.columnType,
    columnRows: getPropertiesByColumnType(entityPattern.columnType, erd, table),
  };
}

function getEntityName(erd, table) {
  if (a5conf.erdLabelType.LOGICAL === erd.labelType) {
    return '"' + table.name + '"';
  } else if (a5conf.erdLabelType.PHYSICAL === erd.labelType) {
    return table.id;
  } else if (a5conf.erdLabelType.BOTH === erd.labelType) {
    return '"' + table.id + ' ' + table.name + '"';
  }
  throw new AppError(
    'labelTypeが不明です'
    + ': erdId=' + erd.id
    + ', labelType=' + erd.labelType
  );
}

function getColumnName(erd, column) {
  if (a5conf.erdLabelType.LOGICAL === erd.labelType) {
    return column.name;
  } else if (a5conf.erdLabelType.PHYSICAL === erd.labelType) {
    return column.id;
  } else if (a5conf.erdLabelType.BOTH === erd.labelType) {
    return column.id + ' ' + column.name;
  }
  throw new AppError();
}

function getPropertiesByColumnType(columnType, erd, table) {
  const properties = [];
  if (columnType === a5conf.erdColumnType.NO) {
    return properties;
  }
  // PKを先頭行に来るように先に処理する
  Object.values(table.columns).forEach((column) => {
    if (!tableManager.isPkField(table, column.id)) {
      return;
    }
    properties.push(createColumnRow(erd, table, column));
  });
  if (columnType === a5conf.erdColumnType.PK) {
    return properties;
  }
  properties.push('==');
  // PK以外を処理する
  Object.values(table.columns).forEach((column) => {
    if (tableManager.isPkField(table, column.id)) {
      return;
    }
    if (columnType === a5conf.erdColumnType.PK_UK &&
      !tableManager.isUkField(table, column.id)) {
      return;
    }
    properties.push(createColumnRow(erd, table, column));
  });
  return properties;
}

function createColumnRow(erd, table, column) {
  // カラム名の編集
  let columnName = getColumnName(erd, column);
  let attr = [];
  // PKの編集
  if (tableManager.isPkField(table, column.id)) {
    columnName = '+ ' + columnName;
    attr.push('PK');
  }
  // UKの編集
  if (tableManager.isUkField(table, column.id)) {
    columnName = '* ' + columnName;
  }
  // FKの編集
  // 編集例） FK(アカウント, ID)
  const foreignKeys = tableManager.getForeignKeysByColumnId(table, column.id);
  foreignKeys.forEach((foreignKey) => {
    const relationship = tableManager.getForeignKey(table, foreignKey.id);
    if (relationship !== null) {
      attr.push(
        'FK(' 
        + getEntityName(erd, relationship.refTable)
        + ', '
        + relationship.refFields
            .map((column) => {
              return getColumnName(erd, column);
            })
            .join(', ')
        + ')'
      );
    }
  });
  if (attr.length === 0) {
    return columnName;
  } else {
    return columnName + ' [' + attr.join(', ') + ']';
  }
}

