#!/usr/bin/env node
'use strict';

const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs-extra');
const path = require('path');

const tableManager = require('./tableManager');
const erdWriter = require('./erdWriter');
const sidebarWriter = require('./sidebarWriter');
const swaggerWriter = require('./swaggerWriter');
const gitbookSummaryWriter = require('./gitbookSummaryWriter');

const cmd = argv._[0];

if (cmd === 'init') {
  [
    {src: __dirname+'/../init/a5doc.yml', dst: path.resolve('')+'/a5doc.yml'},
    {src: __dirname+'/../init/_gitignore', dst: path.resolve('')+'/.gitignore'},
  ].forEach((op) => {
    fs.copyFileSync(op.src, op.dst);
  });
} else if (cmd === 'table') {
  tableManager.writeMdAll();
} else if (cmd === 'erd') {
  erdWriter.writeAll();
} else if (cmd === 'swagger') {
  swaggerWriter.writeAll();
} else if (cmd === 'sidebar') {
  sidebarWriter.write();
} else if (cmd === 'gitbook') {
  const gitbookDir = path.resolve('') + '/.gitbook';
  if (!fs.existsSync(gitbookDir)) {
    fs.copySync(__dirname+'/../.gitbook', gitbookDir);
    const bookPath = path.join(gitbookDir, 'book.json');
    const packagePath = path.resolve('') + '/package.json';
    const book = require(bookPath);
    const pkg = require(packagePath);
    book.title = '〇〇設計書';
    book.author = '作成者〇〇';
    book.root = '..';
    fs.writeFileSync(bookPath, JSON.stringify(book, null, 2));
    if (!pkg.scripts.pdf) {
      pkg.scripts.pdf = 'docker-compose -f .gitbook/docker-compose.yml run --rm gitbook build && docker-compose -f .gitbook/docker-compose.yml run --rm gitbook pdf';
      fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
    }
  }
  gitbookSummaryWriter.write();
} else {
  console.error('不明なコマンドです: ' + cmd);
}

