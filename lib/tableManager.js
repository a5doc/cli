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
      throw new AppError('カラムに必須項目がありません(name, type):' + file);
    }
    table.fields[fieldId] = field;
  });
}

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
  //writeErdAll();
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
    + a5util.mdFileName(table.name)
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
      table.primary.some((id) => {
        return id === fieldId;
      }) ? '○': '',
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

function writeErdAll() {
  if (!conf.table.erd) {
    return;
  }
  const templateText = fs.readFileSync(__dirname + '/../template/erd.md', 'utf8');
  const ejsTemplate = ejs.compile(templateText, {});
  conf.table.erd.forEach((erd) => {
    fs.mkdirsSync(path.dirname(erd.path));

    writeTableMd(table, ejsTableTemplate);
  });
}

function writeErd(erd, ejsTemplate) {
  // テーブル定義の内容をレンダリング
  const mdText = ejsTemplate(crteateErdRenderData(erd));
  // 改行が3個以上連続したら、2つの改行に変換する
  const trimedMdText = mdText.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(erd.path, trimedMdText);
}

function crteateErdRenderData(erd) {
  const tables = readAll();
  // ドキュメントの表
  const docHeadRows = [
    ['ドキュメント', 'ドキュメントID', '表示グループ名'],
    ['ER図', erd.docId, erd.docTitle],
  ];
  // labelTypeの選択肢
  const LavelType = {
    logical: ''
  }

  // ERDに出力する対象のエンティティを検索
  const entities = [];
  Object.keys(erd.entities).forEach((entity) => {
    Object.keys(tables).forEach((tableId) => {
      const table = tables[tableId];
      const re = new RegExp(entity.idPattern);
      if (table.id.match(re)) {
        return;
      }
      entities.push({
        entityName: getEntityName(erd, table),
        table: table,
        columnType: entity.columnType,
        columnRows: getPropertiesByColumnType(erd.columnType, table),
      });
    });
  });
  return {
    erd: erd,
    docHead: mdTableFormatter.format(docHeadRows),
    entities: entities,
  };
}

function getEntityName(erd, table) {
  const entityName = {
    logical: table.name,
    physical: table.id,
    'p+l': table.id + ' ' + table.name,
  };
  if (!entityName[erd.labelType]) {
    throw new AppError(
      'labelTypeが不明です'
      + ': docId=' + erd.docId
      + ', labelType=' + erd.labelType
    );
  }
  return entityName[erd.labelType];
}

function getPropertiesByColumnType(columnType, table) {
  const entityName = {
    logical: table.name,
    physical: table.id,
    'p+l': table.id + ' ' + table.name,
  };
  if (!entityName[erd.labelType]) {
    throw new AppError(
      'labelTypeが不明です'
      + ': docId=' + erd.docId
      + ', labelType=' + erd.labelType
    );
  }
  return entityName[erd.labelType];
}
