'use strict';

const _ = require('lodash');
const a5conf = require('../conf');
const AppError = require('../errors');
const dirnameIndexer = require('./dirnameIndexer');

/**
 * chapter定義に基づいて探索する、対象ドキュメント収集モジュール。
 * a5doc.ymlに定義されたrootChapterの設定で、ドキュメントを検索する。
 */
function getChapters() {
  const conf = a5conf.get();
  if (_.isEmpty(conf.chapters)) {
    throw new AppError('a5doc.ymlにchaptersが設定されていません');
  }
  return conf.chapters
    .map((chapterConf) => {
      return setupChapter(chapterConf);
    });
}
module.exports.getChapters = getChapters;

function setupChapter(chapterConf) {
  let chapter = {
    title: chapterConf.title,
    link: null,
    contents: [],
    chapters: [],
    collapse: chapterConf.collapse,
  };
  if (chapterConf.src) {
    const mdfiles = dirnameIndexer.findAndCreateChapters(chapterConf);
    // dir指定のない検索パターンで、1つだけがマッチした場合は、
    // 見出し=そのファイルへのリンクにする
    if (_.isEmpty(chapterConf.dir)) {
      if (mdfiles.length === 1
        && mdfiles[0].contents.length === 1
        && mdfiles[0].chapters.length === 0) {
        chapter.link = mdfiles[0].contents[0].link;
      } else {
        const that = chapter;
        mdfiles.forEach((mdfile) => {
          that.contents = that.contents.concat(mdfile.contents);
          mdfile.chapters.forEach((chapter) => {
            that.contents = that.contents.concat(chapter.contents);
          });
        });
      }
    } else {
      chapter.chapters = mdfiles;
    }
    mdfiles.forEach((chapter) => {
  /*
      if (chapter.contents.length === 0
        && chapter.mdfiles.length === 1) {
        chapter = chapter.mdfiles[0];
        if (chapterConf.title) {
          chapter.title = chapterConf.title;
        }
      }
  */
    });
  }
  if (chapterConf.chapters) {
    chapter.chapters = chapterConf.chapters
      .map((subchapterConf) => {
        return setupChapter(subchapterConf);
      });
  }
  return chapter;
}
