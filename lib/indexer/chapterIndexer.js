'use strict';

const path = require('path');
const a5conf = require('../conf');
const a5util = require('../util');

/**
 * chapter定義に基づいて探索する、対象ドキュメント収集モジュール。
 * a5doc.ymlに定義されたrootChapterの設定で、ドキュメントを検索する。
 */
function getChapter() {
  const conf = a5conf.get();
  return setupChapter(conf.rootChapter);
}
module.exports.getChapter = getChapter;

function setupChapter(chapterConf) {
  const conf = a5conf.get();
  const chapter = {
    title: chapterConf.title,
    contents: [],
    subchapters: []
  };
  if (chapterConf.src) {
    const docFiles = searchSrcMd(chapterConf.src);
    docFiles.forEach((docFile) => {
      const doc = path.parse(docFile);
      const relative = path.relative(conf.docroot, docFile);
      const relativeDir = path.dirname(relative);
      const dirs = relativeDir.split(/[\\\/]/);
      const link = conf.docstyle === 'wiki' ? doc.name: doc.base;
      chapter.contents.push({
        title: doc.name,
        link: dirs.join('/') + '/' + link,
      });
    });
    chapter.contents = chapter.contents
      .sort((a, b) => {
        return a.title.localeCompare(b.title);
      });
  }
  if (chapterConf.subchapters) {
    chapter.subchapters = chapterConf.subchapters
    .map((subchapterConf) => {
      return setupChapter(subchapterConf);
    });
  }
  return chapter;
}

function searchSrcMd(src) {
  const conf = a5conf.get();
  const srcPatters = Array.isArray(src) ? src: [src];
  srcPatters.push('!' + conf.docroot + '/**/_sidebar.md');
  return a5util.findFilesGlob(srcPatters);
}

