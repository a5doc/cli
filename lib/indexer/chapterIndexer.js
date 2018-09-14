'use strict';

const deepExtend = require('deep-extend');
const a5conf = require('../conf');
const mdFileIndexer = require('./mdFileIndexer');

/**
 * chapter定義に基づいて探索する、対象ドキュメント収集モジュール。
 * a5doc.ymlに定義されたrootChapterの設定で、ドキュメントを検索する。
 */
function getChapter() {
  const conf = a5conf.get();
  const chapterRoot = setupChapter(conf.rootChapter);
  return chapterRoot;
}
module.exports.getChapter = getChapter;

function setupChapter(chapterConf) {
  let chapter = {
    title: chapterConf.title,
    contents: [],
    subchapters: [],
    collapse: chapterConf.collapse,
  };
  if (chapterConf.src) {
    deepExtend(chapter, mdFileIndexer.findAndCreateChapter(chapterConf));
    if (chapter.contents.length === 0
      && chapter.subchapters.length === 1) {
      chapter = chapter.subchapters[0];
      if (chapterConf.title) {
        chapter.title = chapterConf.title;
      }
    }
    if (chapter.contents.length === 1 && chapter.title) {
      chapter.contents[0].title = chapter.title;
    }
  }
  if (chapterConf.subchapters) {
    chapter.subchapters = chapterConf.subchapters
      .map((subchapterConf) => {
        return setupChapter(subchapterConf);
      });
  }
  return chapter;
}
