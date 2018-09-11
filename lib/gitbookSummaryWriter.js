'use strict';

const fs = require('fs-extra');
const ejs = require('ejs');
const a5conf = require('./conf');
const mdUtil = require('./util/mdUtil');
const indexerFactory = require('./indexer/indexerFactory');

/**
 * gitbookのSUMMARY.mdを作成する.
 */
function write() {
  const conf = a5conf.get();
  conf.docstyle = 'md';
  const templateText = fs.readFileSync(__dirname + '/../template/gitbook/SUMMARY.md', 'utf8');
  const ejsTemplate = ejs.compile(templateText, {});
  const orgDocstyle = conf.docstyle;
  const indexer = indexerFactory.getIndexer();
  const mdText = ejsTemplate({
    chapterRoot: indexer.getChapter()
  });
  fs.writeFileSync(conf.docroot+'/SUMMARY.md', mdUtil.fixes(mdText));
  conf.docstyle = orgDocstyle;
}
module.exports.write = write;
