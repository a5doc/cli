'use strict';

const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const a5conf = require('./conf')();
const a5util = require('./util');

const tableDataPath = path.resolve('') + '/.tmp/tables.json';

function writeTableData(data) {
  var exists = false;
  try {
    exists = fs.statSync(path.dirname(tableDataPath));
  } catch (e) {
  }
  if (!exists) {
    fs.mkdirSync(path.dirname(tableDataPath));
  }
  fs.writeFileSync(tableDataPath, JSON.stringify(data));
}

module.exports.all = () => {
  const targetFiles = a5util.findFilesGlob(a5conf.tableFinder);
  const tables = {};
  targetFiles.forEach((file) => {
    const table = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
    tables[table.id] = table;
  });
  writeTableData(tables);
  return tables;
}
