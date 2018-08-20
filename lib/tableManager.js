'use strict';

const extend = require('util')._extend;
const fs = require('fs-extra');
const yaml = require('js-yaml');
const ejs = require('ejs');
const a5conf = require('./conf')();
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
  const targetFiles = a5util.findFilesGlob(a5conf.table.src);
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
  const tables = readAll();
  const templateText = fs.readFileSync(__dirname + '/../template/table.md', 'utf8');
  fs.mkdirp(a5conf.table.output);
  const template = ejs.compile(templateText, {});
  Object.keys(tables).forEach((tableId) => {
    const table = tables[tableId];
    const mdText = template(renderData(table));
    // 改行が3個以上連続したら、2つの改行に変換する
    const trimedMdText = mdText.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n');
    const filePath = a5conf.table.output 
      + '/'
      + a5util.mdFileName(table.name)
      + '.md';
    fs.writeFileSync(filePath, trimedMdText);
  });
}
module.exports.writeMdAll = writeMdAll;

function renderData(table) {
  // ドキュメントの表
  const docHeadRows = [
    ['ドキュメント', 'テーブルID', 'テーブル名'],
    ['テーブル定義', table.id, table.name],
  ];
  // カラム定義の表
  const columnSpecRows = [
    ['論理名','物理名','PK','型','サイズ','精度','NOT NULL','備考'],
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
      field.type,
      field.length,
      field.scale,
      field.notNull === true ? '○': '',
      note.replace(/[\r]/, '').replace(/\n/, '<br>'),
    ]);
  });
  // インデックス
  const indexSpecRows = [];
  if (table.indexes && Object.keys(table.indexes).length > 0) {
    indexSpecRows.push(
      ['No','インデックス名','ユニーク','カラム名'],
    );
    Object.keys(table.indexes).forEach((indexId) => {
      const index = table.indexes[indexId];
      indexSpecRows.push([
        indexSpecRows.length,
        indexId,
        index.type === 'unique' ? '○': '',
        index.columns.join('<br>'),
      ]);
    });
  }
  return {
    table: table,
    docHead: mdTableFormatter.format(docHeadRows),
    columnSpec: mdTableFormatter.format(columnSpecRows),
    columnSpecFootNotes: columnSpecFootNotes,
    indexSpec: mdTableFormatter.format(indexSpecRows),
  };
}

function defaultStr(str) {
  return str ? str: '';
}