#!/usr/bin/env node
'use strict';

const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs-extra');
const path = require('path');

const tableManager = require('./tableManager');
const erdWriter = require('./erdWriter');
const sidebarWriter = require('./sidebarWriter');
const gitbookSummaryWriter = require('./gitbookSummaryWriter');

const cmd = argv._[0];

if (cmd === 'init') {
  [
    {src: __dirname+'/../a5doc.yml', dst: path.resolve('')+'/a5doc.yml'},
    {src: __dirname+'/../book.json', dst: path.resolve('')+'/book.json'},
  ].forEach((op) => {
    fs.copyFileSync(op.src, op.dst, fs.constants.COPYFILE_EXCL);
  });
} else if (cmd === 'table') {
  tableManager.writeMdAll();
} else if (cmd === 'erd') {
  erdWriter.writeAll();
} else if (cmd === 'sidebar') {
  sidebarWriter.write();
} else if (cmd === 'gitbook') {
  gitbookSummaryWriter.write();
} else {
  console.error('不明なコマンドです: ' + cmd);
}

