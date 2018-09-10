'use strict';

const path = require('path');
const a5conf = require('../conf');
const a5util = require('../util');

/**
 * ディレクトリ探索型の対象ドキュメント収集モジュール。
 * docrootのディレクトリ配下のmdファイルを検索して
 * chapter型で階層的にリストする。
 */
function getChapter() {
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
  sortChapter(chapterRoot);
  return chapterRoot;
}
module.exports.getChapter = getChapter;

function sortChapter(chapter) {
  chapter.contents = chapter.contents
    .sort((a, b) => {
      return a.title.localeCompare(b.title);
    });
  chapter.subchapters = Object.values(chapter.subchapters)
    .sort((a, b) => {
      return a.title.localeCompare(b.title);
    });
  chapter.subchapters.forEach((subcapter) => {
    sortChapter(subcapter);
  });
}
