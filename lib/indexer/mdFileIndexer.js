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
  return findAndCreateChapter(conf.docindex.title, conf.docroot + '/**/*.md');
}
module.exports.getChapter = getChapter;

function findAndCreateChapter(title, scanPatterns) {
  const conf = a5conf.get();
  const chapterRoot = {
    title: title,
    contents: [],
    subchapters: {}
  };
  if (!Array.isArray(scanPatterns)) {
    scanPatterns = [scanPatterns];
  }
  scanPatterns = scanPatterns.concat(
    ['!' + conf.docroot + '/**/_sidebar.md']
  );
  a5util.findFilesGlob(scanPatterns)
    .filter((docFile) => {
      return !docFile.match(/\/node_modules\//);
    })
    .forEach((docFile) => {
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
module.exports.findAndCreateChapter = findAndCreateChapter;

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
