'use strict';

const path = require('path');
const a5conf = require('../conf');
const a5util = require('../util');

/**
 * ディレクトリ探索型の対象ドキュメント収集モジュール。
 * docrootのディレクトリ配下のmdファイルを検索して
 * chapter型で階層的にリストする。
 */
function getChapters() {
  const conf = a5conf.get();
  return findAndCreateChapters({
    title: conf.sidebar.title,
    src: '**/*.md'
  });
}
module.exports.getChapters = getChapters;

function findAndCreateChapters(chapterConf) {
  const conf = a5conf.get();
  const chapterRootMap = {};
  let scanPatterns = Array.isArray(chapterConf.src) ? chapterConf.src: [chapterConf.src];
  let chapterDir;
  if (!chapterConf.dir) {
    chapterDir = conf.docroot;
  } else {
    chapterDir = conf.docroot + '/' + chapterConf.dir;
  }
  scanPatterns = scanPatterns.map((pattern) => {
    if (pattern.match(/^!/)) {
      return '!' + chapterDir + '/' + pattern.substr(1);
    } else {
      return chapterDir + '/' + pattern;
    }
  });
  scanPatterns = scanPatterns.concat([
    '!' + conf.docroot + '/_Sidebar.md',
    '!' + conf.docroot + '/**/node_modules/**/*'
  ]);
  a5util.findFilesGlob(scanPatterns)
    .forEach((docFile) => {
      const doc = path.parse(docFile);
      const relative = path.relative(chapterDir, docFile);
      const relativeDir = path.dirname(relative);
      const dirs = relativeDir.split(/[\\\/]/);
      let chapterMap = chapterRootMap;
      let chapter;
      dirs.forEach((dir) => {
        if (!chapterMap[dir]) {
          chapterMap[dir] = {
            title: (dir === '.' ? null: dir),
            link: null,
            contents: [],
            chapters: {},
          };
        }
        chapter = chapterMap[dir];
        chapterMap = chapter.chapters;
      });
      const link = path.join(
        path.relative(conf.docroot, chapterDir),
        relativeDir,
        conf.docstyle === 'wiki' ? doc.name: doc.base
      ).replace(/[\\]/g, '/');
      chapter.contents.push({
        title: doc.name,
        link: link,
      });
      /*
      console.log({
        docFile:docFile,
        doc:doc,
        docroot:conf.docroot,
        chapterDir:chapterDir,
        relative:relative,
        relativeDir:relativeDir,
        dirs:dirs,
        link:link,
      });
      console.log(JSON.stringify(sortChapter(Object.values(chapterRootMap)),null,2));
      */
    });
  return sortChapter(Object.values(chapterRootMap));
}
module.exports.findAndCreateChapters = findAndCreateChapters;

function sortChapter(chapters) {
  const titlesort = (a, b) => {
    if (a.title === null && b.title === null) {
      return 0;
    }
    if (a.title === null && b.title !== null) {
      return -1;
    }
    if (a.title !== null && b.title === null) {
      return 1;
    }
    return a.title.localeCompare(b.title);
  };

  chapters = chapters.sort(titlesort);
  chapters.forEach((chapter) => {
    chapter.contents = chapter.contents.sort(titlesort);
    chapter.chapters = Object.values(chapter.chapters).sort(titlesort);
    sortChapter(chapter.chapters);
  });
  return chapters;
}
