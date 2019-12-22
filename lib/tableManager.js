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
    columns: {},
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
  if (Object.keys(table.columns).length === 0) {
    throw new AppError('columns が定義されていません:' + file);
  }
  Object.keys(table.columns).forEach((columnId) => {
    const column = extend({
      autoIncrement: false,
      length: null,
      notNull: true,
      scale: null,
    }, table.columns[columnId]);
    if (!column.name || !column.type) {
      throw new AppError('カラムにname, typeがありません:' + file);
    }
    column.id = columnId;
    table.columns[columnId] = column;
  });
  table.primary.forEach((columnId) => {
    if (!table.columns[columnId]) {
      throw new AppError(
        'primaryで指定されているカラムが存在しません'
        + ': ' + table.id
        + ', ' + columnId
      );
    }
  });
  if (table.foreignKeys) {
    Object.keys(table.foreignKeys).forEach((foreignKeyId) => {
      const foreignKey = table.foreignKeys[foreignKeyId];
      foreignKey.id = foreignKeyId;
      foreignKey.columns.forEach((columnId) => {
        if (!table.columns[columnId]) {
          throw new AppError(
            'foreignKeysで指定されているカラムが存在しません'
            + ': table=' + table.id
            + ', foreignKey=' + foreignKeyId
            + ', column=' + columnId
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
          if (!refTable.columns[columnId]) {
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

function isPkField(table, columnId) {
  return table.primary.some((id) => {
    return id === columnId;
  });
}
module.exports.isPkField = isPkField;

function isUkField(table, columnId) {
  if (!table.indexes) {
    return false;
  }
  const indexes = Object.values(table.indexes);
  for (let i=0; i < indexes.length; i++) {
    const index = indexes[i];
    const found = index.columns.some((id) => {
      return id === columnId;
    });
    if (found) {
      return true;
    }
  }
  return false;
}
module.exports.isUkField = isUkField;

function getForeignKeysByColumnId(table, columnId) {
  if (!table.foreignKeys) {
    return null;
  }
  // table.foreignKeys の中から columnId のカラムで FK を探す
  const ids = Object.keys(table.foreignKeys);
  let found = null;
  for (let i=0; i < ids.length; i++) {
    const fk = table.foreignKeys[ids[i]];
    const eq = fk.columns.some((_columnId) => {
      return columnId === _columnId;
    });
    if (eq) {
      // 返り値には、table.foreignKeys の プロパティがないので、
      // id として、詰め込んで返す
      found = Object.assign(fk, {id: ids[i]});
      break;
    }
  }
  return found;
}
module.exports.getForeignKeysByColumnId = getForeignKeysByColumnId;

function getReferences(table, fkId) {
  if (!table.foreignKeys || Object.keys(table.foreignKeys).length === 0) {
    return null;
  }
  const foreignKey = table.foreignKeys[fkId];
  const tables = readAll();
  const refTable = tables[foreignKey.references.tableId];
  return {
    foreignKey: foreignKey,
    refTable: refTable,
    refColumns: foreignKey.references.columns.map((columnId) => {
      return refTable.columns[columnId];
    }),
  };
}
module.exports.getReferences = getReferences;

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

function tableStr(table) {
  if (table.name == table.id) {
    return table.name;
  } else {
    return table.name + ' (' + table.id + ')';
  }
}

function columnStr(columnId, table) {
  const c = table.columns[columnId];
  if (c.name == c.id) {
    return c.name;
  } else {
    return c.name + ' (' + c.id + ')';
  }
}

function crteateTableRenderData(table) {
  const conf = a5conf.get();
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
      ['No','インデックス名','ユニーク','カラム名']
    );
    Object.keys(table.indexes).forEach((indexId) => {
      const index = table.indexes[indexId];
      const indexNo = indexSpecRows.length;
      indexSpecRows.push([
        indexNo,
        indexId,
        index.type === 'unique' ? '○': '',
        index.columns.map(c => columnStr(c, table)).join('<br>'),
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
  Object.keys(table.columns).forEach((columnId) => {
    const column = table.columns[columnId];
    // 備考が2行以上あるときは、表外の脚注に転記する
    let desc = column.desc ? column.desc.trim(): '';
    const descLines = desc.split(/\n/);
    if (descLines.length > 1) {
      const footNoteNo = columnSpecFootNotes.length + 1;
      const footNote = {
        index: 'columnSpecFootNote' + footNoteNo,
        label: '※' + footNoteNo,
        desc: desc,
      };
      // 脚注に追加
      columnSpecFootNotes.push(footNote);
      // 表内のdescには、脚注へのリンクで置き換える
      desc = '[' + footNote.label + '](#' + footNote.index + ')';
    }
    // オートナンバーは、備考に記載する
    if (column.autoIncrement) {
      desc = 'オートナンバー\n' + desc;
    }
    // FKも備考にいれる
    const fk = getForeignKeysByColumnId(table, columnId);
    if (fk != null) {
      if (desc != '') {
        desc += '\n';
      }
      const references = getReferences(table, fk.id);
      const ext = (conf.docstyle === 'wiki') ? '' : '.md';
      desc += `[FK(${references.refTable.name})](${references.refTable.name}${ext})`;
    }
    desc = desc.trim();
    columnSpecRows.push([
      column.name,
      columnId,
      isPkField(table, columnId) ? '○': '',
      indexMap[columnId] ? indexMap[columnId].join(', '): '',
      column.type,
      column.length,
      column.scale,
      column.notNull === true ? '○': '',
      desc.replace(/[\r]/, '').replace(/\n/, '<br>'),
    ]);
  });
  // FK
  const fkSpecRows = [];
  if (table.foreignKeys && Object.keys(table.foreignKeys).length > 0) {
    fkSpecRows.push(
      ['No','外部キー名','カラム名','対象テーブル','対象カラム']
    );
    Object.keys(table.foreignKeys).forEach((id) => {
      const fk = table.foreignKeys[id];
      const fkNo = fkSpecRows.length;
      const references = getReferences(table, id);
      fkSpecRows.push([
        fkNo,
        id,
        fk.columns.map(c => columnStr(c, table)).join('<br>'),
        tableStr(references.refTable),
        fk.references.columns.map(c => columnStr(c, references.refTable)).join('<br>'),
      ]);
    });
  }
  return {
    table: table,
    docHead: mdTableFormatter.format(docHeadRows),
    columnSpec: mdTableFormatter.format(columnSpecRows),
    columnSpecFootNotes: columnSpecFootNotes,
    indexSpec: mdTableFormatter.format(indexSpecRows),
    fkSpec: mdTableFormatter.format(fkSpecRows),
  };
}
