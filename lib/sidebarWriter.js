'use strict';

const fs = require('fs-extra');
const path = require('path');
const ejs = require('ejs');
const a5conf = require('./conf');
const a5util = require('./util');
const mdUtil = require('./util/mdUtil');

/**
 * _sidebarを作成する.
 */
function write() {
  const conf = a5conf.get();
  const templateText = fs.readFileSync(__dirname + '/../template/_sidebar.md', 'utf8');
  const ejsTemplate = ejs.compile(templateText, {});
  const mdText = ejsTemplate(crteateSidebarRenderData());
  fs.writeFileSync(conf.docroot+'/_sidebar.md', mdUtil.fixes(mdText));
}
module.exports.write = write;

function crteateSidebarRenderData() {
  const conf = a5conf.get();
  const docFiles = a5util.findFilesGlob([
    conf.docroot + '/**/*.md',
    '!' + conf.docroot + '/**/_sidebar.md',
  ]);
  const chapterRoot = {
    title: conf.docindex.title,
    contents: [],
    subchapters: {}
  };
  docFiles.forEach((docFile) => {
    const doc = path.parse(docFile);
    const relative = path.relative(conf.docroot, docFile);
    const relativeDir = path.dirname(relative);
    const dirs = relativeDir.split(/[\\\/]/);
    let chapterMap = relativeDir === '.' ? chapterRoot: chapterRoot.subchapters;
    let chapter;
    dirs.forEach((dir) => {
      if (relativeDir === '.') {
        chapter = chapterMap;
      } else {
        if (!chapterMap[dir]) {
          chapterMap[dir] = {
            title: dir,
            contents: [],
            subchapters: {}
          };
        }
        chapter = chapterMap[dir];
      }
      chapterMap = chapter.subchapters;
    });
    const link = conf.docstyle === 'wiki' ? doc.name: doc.base;
    chapter.contents.push({
      title: doc.name,
      link: dirs.join('/') + '/' + link,
    });
  });
  return {
    chapterRoot: chapterRoot,
  }
}
