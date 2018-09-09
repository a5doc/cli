'use strict';

const argv = require('minimist')(process.argv.slice(2));

const tableManager = require('./tableManager');
const erdWriter = require('./erdWriter');
const sidebarWriter = require('./sidebarWriter');

const cmd = argv._[0];

if (cmd === 'table') {
  tableManager.writeMdAll();
} else if (cmd === 'erd') {
  erdWriter.writeAll();
} else if (cmd === 'sidebar') {
  sidebarWriter.write();
} else {
  console.error('不明なコマンドです: ' + cmd);
}

