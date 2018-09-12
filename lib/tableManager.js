'use strict';

const extend = require('util')._extend;
const fs = require('fs-extra');
const yaml = require('js-yaml');
const ejs = require('ejs');
const a5conf = require('./conf');
const a5util = require('./util');
const mdUtil = require('./util/mdUtil');
const AppError = require('./errors');
const mdTableFormatter = require('./util/mdTableFormatter');

/**
 * テーブル情報のキャッシュ  
 * ymlから読み込んだデータをテーブルIDをキーにしたマップで保持  
 * @type {object} 
 */
let cacheTables;

function readAll() {
  if (cacheTables) {
    return cacheTables;
  }
  const conf = a5conf.get();
  const targetFiles = a5util.findFilesGlob(conf.table.src);
  cacheTables = {};
  targetFiles.forEach((file) => {
    const table = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
    fillDefaultTable(table, file);
    cacheTables[table.id] = table;
  });
  validateRelationship(cacheTables);
  return cacheTables;
}
module.exports.readAll = readAll;

function fillDefaultTable(ymldata, file) {
  const table = extend({
    category: '',
    description: '',
    fields: {},
  }, ymldata);

  if (!table.primary) {
    throw new AppError('テーブル定義に primary がありません:' + file);
  }
  if (!Array.isArray(table.primary)) {
    throw new AppError('primary は配列で定義してください:' + file);
  }
  if (!table.id || !table.name) {
    throw new AppError('テーブル定義に必須項目がありません(id, name):' + file);
  }
  if (Object.keys(table.fields).length === 0) {
    throw new AppError('fields が定義されていません:' + file);
  }
  Object.keys(table.fields).forEach((fieldId) => {
    const field = extend({
      autoIncrement: false,
      length: null,
      notNull: true,
      scale: null,
    }, table.fields[fieldId]);
    if (!field.name || !field.type) {
      throw new AppError('カラムにname, typeがありません:' + file);
    }
    field.id = fieldId;
    table.fields[fieldId] = field;
  });
  table.primary.forEach((fieldId) => {
    if (!table.fields[fieldId]) {
      throw new AppError(
        'primaryで指定されているカラムが存在しません'
        + ': ' + table.id
        + ', ' + fieldId
      );
    }
  });
  if (table.foreignKeys) {
    Object.keys(table.foreignKeys).forEach((foreignKeyId) => {
      const foreignKey = table.foreignKeys[foreignKeyId];
      foreignKey.id = foreignKeyId;
      foreignKey.columns.forEach((columnId) => {
        if (!table.fields[columnId]) {
          throw new AppError(
            'foreignKeysで指定されているカラムが存在しません'
            + ': table=' + table.id
            + ', foreignKey=' + foreignKeyId
            + ', column=' + fieldId
          );
        }
      });
    });
  }
}

function validateRelationship(tables) {
  Object.values(tables)
    .filter((table) => {
      return table.foreignKeys;
    })
    .forEach((table) => {
      Object.keys(table.foreignKeys).forEach((foreignKeyId) => {
        const foreignKey = table.foreignKeys[foreignKeyId];
        if (!tables[foreignKey.references.tableId]) {
          throw new AppError(
            'foreignKeysで指定されているテーブルが存在しません'
            + ': table=' + table.id
            + ', foreignKey=' + foreignKeyId
            + ', references=' + foreignKey.references.tableId
          );
        }
        const refTable = tables[foreignKey.references.tableId];
        foreignKey.references.columns.forEach((columnId) => {
          if (!refTable.fields[columnId]) {
            throw new AppError(
              'foreignKeysで指定されている外部テーブルのカラムが存在しません'
              + ': table=' + table.id
              + ', foreignKey=' + foreignKeyId
              + ', references=' + refTable.id + ' ' + columnId
            );
          }
        });
      });
    });
}

function isPkField(table, fieldId) {
  return table.primary.some((id) => {
    return id === fieldId;
  });
}
module.exports.isPkField = isPkField;

function isUkField(table, fieldId) {
  if (!table.indexes) {
    return false;
  }
  const indexes = Object.values(table.indexes);
  for (let i=0; i < indexes.length; i++) {
    const index = indexes[i];
    const found = index.columns.some((id) => {
      return id === fieldId;
    });
    if (found) {
      return true;
    }
  }
  return false;
}
module.exports.isUkField = isUkField;

function getForeignKeysByColumnId(table, fieldId) {
  if (!table.foreignKeys) {
    return [];
  }
  // table.foreignKeys の中から fieldId のカラムで FK を探す
  return Object.values(table.foreignKeys)
    .filter((fk) => {
      return fk.columns
        .some((fkColumnId) => {
          return fieldId === fkColumnId;
        });
    });
}
module.exports.getForeignKeysByColumnId = getForeignKeysByColumnId;

function getForeignKey(table, fkId) {
  if (!table.foreignKeys) {
    return null;
  }
  const foreignKey = table.foreignKeys[fkId];
  const tables = readAll();
  const refTable = tables[foreignKey.references.tableId];
  return {
    foreignKey: foreignKey,
    refTable: refTable,
    refFields: foreignKey.references.columns.map((columnId) => {
      return refTable.fields[columnId];
    }),
  };
}
module.exports.getForeignKey = getForeignKey;

function writeMdAll() {
  const conf = a5conf.get();
  const tables = readAll();
  const templateText = fs.readFileSync(__dirname + '/../template/table.md', 'utf8');
  fs.mkdirsSync(conf.table.tableMdDir);
  const ejsTemplate = ejs.compile(templateText, {});
  Object.keys(tables).forEach((tableId) => {
    const table = tables[tableId];
    writeTableMd(table, ejsTemplate);
  });
}
module.exports.writeMdAll = writeMdAll;

function writeTableMd(table, ejsTemplate) {
  const conf = a5conf.get();
  // テーブル定義の内容をレンダリング
  const mdText = ejsTemplate(crteateTableRenderData(table));
  // 改行が3個以上連続したら、2つの改行に変換する
  const trimedMdText = mdText.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n');
  const filePath = conf.table.tableMdDir 
    + '/'
    + mdUtil.mdFileName(table.name)
    + '.md';
  fs.writeFileSync(filePath, trimedMdText);
}

function crteateTableRenderData(table) {
  // ドキュメントの表
  const docHeadRows = [
    ['ドキュメント', 'テーブルID', 'テーブル名'],
    ['テーブル定義', table.id, table.name],
  ];
  // インデックス
  const indexSpecRows = [];
  const indexMap = {};
  if (table.indexes && Object.keys(table.indexes).length > 0) {
    indexSpecRows.push(
      ['No','インデックス名','ユニーク','カラム名'],
    );
    Object.keys(table.indexes).forEach((indexId) => {
      const index = table.indexes[indexId];
      const indexNo = indexSpecRows.length;
      indexSpecRows.push([
        indexNo,
        indexId,
        index.type === 'unique' ? '○': '',
        index.columns.join('<br>'),
      ]);
      if (index.type === 'unique') {
        index.columns.forEach((column) => {
          if (!indexMap[column]) {
            indexMap[column] = [];
          }
          indexMap[column].push(indexNo);
        });
      }
    });
  }
  // カラム定義の表
  const columnSpecRows = [
    ['論理名','物理名','PK','UK','型','サイズ','精度','NOT NULL','備考'],
  ];
  // 表外の脚注
  const columnSpecFootNotes = [];
  Object.keys(table.fields).forEach((fieldId) => {
    const field = table.fields[fieldId];
    let note = field.note ? field.note.trim(): '';
    // 備考が2行以上あるときは、表外の脚注に転記する
    const noteLines = note.split(/\n/);
    if (noteLines.length > 1) {
      const footNoteNo = columnSpecFootNotes.length + 1;
      const footNote = {
        index: 'columnSpecFootNote' + footNoteNo,
        label: '※' + footNoteNo,
        note: note,
      };
      // 脚注に追加
      columnSpecFootNotes.push(footNote);
      // 表内のnoteには、脚注へのリンクで置き換える
      note = '[' + footNote.label + '](#' + footNote.index + ')';
    }
    // オートナンバーは、備考に記載する
    if (field.autoIncrement) {
      note = 'オートナンバー\n' + note;
    }
    note = note.trim();
    columnSpecRows.push([
      field.name,
      fieldId,
      isPkField(table, fieldId) ? '○': '',
      indexMap[fieldId] ? indexMap[fieldId].join(', '): '',
      field.type,
      field.length,
      field.scale,
      field.notNull === true ? '○': '',
      note.replace(/[\r]/, '').replace(/\n/, '<br>'),
    ]);
  });
  return {
    table: table,
    docHead: mdTableFormatter.format(docHeadRows),
    columnSpec: mdTableFormatter.format(columnSpecRows),
    columnSpecFootNotes: columnSpecFootNotes,
    indexSpec: mdTableFormatter.format(indexSpecRows),
  };
}
