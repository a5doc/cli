'use strict';

const a5conf = require('../conf');

function getIndexer() {
  const conf = a5conf.get();
  return require('./'+conf.docindex.indexer);
}
module.exports.getIndexer = getIndexer;