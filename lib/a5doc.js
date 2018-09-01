'use strict';

const argv = require('minimist')(process.argv.slice(2));

const tableManager = require('./tableManager');

const cmd = argv._[0];

if (cmd === 'write-table-spec') {
  tableManager.writeMdAll();
} else {
  console.error('不明なコマンドです: ' + cmd);
}

