'use strict';

const fs = require('fs-extra');
const path = require('path');
const a5conf = require('./conf');
const a5util = require('./util');
const yaml = require('js-yaml');

const conf = a5conf.get();

/**
 * mdにfront-matterを付ける
 */
function writeAll() {
  // 対象のファイルを検索
  const docFiles = a5util.findFilesGlob('**/*.md', {
    rootDir: conf.docroot
  });
  docFiles.forEach(docFile => {
    console.log(`${docFile} ...`);
    let doc = fs.readFileSync(docFile, 'utf8');
    doc = convert(doc, docFile);
    if (doc === false) {
      return;
    }
    fs.writeFileSync(docFile, doc);
  });
}
module.exports.writeAll = writeAll;

function convert(doc, docPath) {
  if (doc.match(/^---/)) {
    return false;
  }
  const dirs = path.dirname(path.relative(conf.docroot, docPath));
  let cats = dirs.split(/[\/\\]/);
  if (cats.length == 1) {
    cats = (cats[0] === '.') ? '' : cats[0];
  }
  const fm = yaml.safeDump({
    'title': path.basename(docPath, '.md'),
    'category': cats,
  });
  return `---\n${fm}---\n\n${doc}`;
}
module.exports.convert = convert;
