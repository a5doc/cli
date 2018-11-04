'use strict';

const a5conf = require('../conf');

function getIndexer(indexerName) {
  const conf = a5conf.get();
  if (!indexerName) {
    indexerName = conf.sidebar.indexer;
  }
  return require('./'+indexerName);
}
module.exports.getIndexer = getIndexer;
