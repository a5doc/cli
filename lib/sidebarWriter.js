'use strict';

const fs = require('fs-extra');
const ejs = require('ejs');
const a5conf = require('./conf');
const mdUtil = require('./util/mdUtil');
const indexerFactory = require('./indexer/indexerFactory');

/**
 * _sidebarを作成する.
 */
function write() {
  const conf = a5conf.get();
  const templateText = fs.readFileSync(__dirname + '/../template/_sidebar.md', 'utf8');
  const ejsTemplate = ejs.compile(templateText, {});
  const indexer = indexerFactory.getIndexer();
  const mdText = ejsTemplate({
    chapters: indexer.getChapters(),
    mdUtil: mdUtil,
    conf: conf
  });
  fs.writeFileSync(conf.docroot+'/_sidebar.md', mdUtil.fixes(mdText));
}
module.exports.write = write;
