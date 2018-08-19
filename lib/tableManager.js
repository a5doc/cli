'use strict';

const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const a5conf = require('./conf')();
const a5util = require('./util');

let cacheTables;

function readAll() {
  if (cacheTables) {
    return cacheTables;
  }
  const targetFiles = a5util.findFilesGlob(a5conf.table.src);
  cacheTables = {};
  targetFiles.forEach((file) => {
    const table = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
    cacheTables[table.id] = table;
  });
  return cacheTables;
}
module.exports.readAll = readAll;

function writeMd() {
  const tables = readAll();

}
module.exports.writeMd = writeMd;
