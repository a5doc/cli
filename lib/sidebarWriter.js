'use strict';

const fs = require('fs-extra');
const ejs = require('ejs');
const a5conf = require('./conf');
const mdUtil = require('./util/mdUtil');
const indexerFactory = require('./indexer/indexerFactory');

/**
 * _Sidebarを作成する.
 */
function write() {
  const conf = a5conf.get();
  const templateText = fs.readFileSync(__dirname + '/../template/_Sidebar.md', 'utf8');
  const ejsTemplate = ejs.compile(templateText, {});
  const indexer = indexerFactory.getIndexer();
  const mdText = ejsTemplate({
    chapters: indexer.getChapters(),
    mdUtil: mdUtil,
    conf: conf
  });
  fs.writeFileSync(conf.docroot+'/_Sidebar.md', mdUtil.fixes(mdText));
}
module.exports.write = write;
