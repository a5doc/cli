'use strict';

const fs = require('fs-extra');
const path = require('path');

const fixtureDir = (path.resolve('')+'/lib/__tests__/fixture').replace(/\\/g, '/');
const outtmpDir = (path.resolve('')+'/.tmp').replace(/\\/g, '/');
const tmpDocrootDir = outtmpDir + '/docroot';
 
const a5conf = require('../conf');
const a5util = require('../util');
const chapterIndexer = require('./chapterIndexer');

a5conf._extend({
  // ドキュメントのrootディレクトリ
  docroot: '.tmp/docroot',
  rootChapter: {
    title: 'TOP',
    src: '.tmp/docroot/TOP.md',
    subchapters: [{
      title: 'chapter0',
      subchapters: [{
        title: 'chapter2',
        src: '.tmp/docroot/chapter2/*.md',
        subchapters: [{
          title: 'chapter2.1',
          src: [
            '.tmp/docroot/chapter2/**/*.md',
            '!.tmp/docroot/chapter2/仕様2.md'
          ],
        }],
      }, {
        title: 'chapter1',
        src: '.tmp/docroot/chapter1/*.md',
      }]
    }],
  }
});

describe('getChapter', () => {
  fs.removeSync(tmpDocrootDir);
  fs.copySync(fixtureDir+'/sidebar', tmpDocrootDir, {
    clobber: true, 
    filter: function (element) {
      return true;
    }
  });
  const actual = chapterIndexer.getChapter();
  
  test('root chapter', () => {
    expect(actual.title).toBe('TOP');
    expect(actual.contents).toEqual([
      {title: 'TOP', link: './TOP'},
    ]);
    expect(actual.subchapters.length).toBe(1);
  });
  test('chapter0', () => {
    const chapter = actual.subchapters[0];
    expect(chapter.title).toBe('chapter0');
    expect(chapter.contents.length).toBe(0);
    expect(chapter.subchapters.length).toBe(2);
  });
  test('chapter2', () => {
    const chapter = actual.subchapters[0].subchapters[0];
    expect(chapter.title).toBe('chapter2');
    expect(chapter.contents.length).toBe(1);
    expect(chapter.contents).toEqual([
      {title: '仕様2', link: 'chapter2/仕様2'},
    ]);
    expect(chapter.subchapters.length).toBe(1);
  });
  test('chapter2.1', () => {
    const chapter = actual.subchapters[0].subchapters[0].subchapters[0];
    expect(chapter.title).toBe('chapter2.1');
    expect(chapter.contents.length).toBe(1);
    expect(chapter.contents).toEqual([
      {title: 'あいうえお', link: 'chapter2/章2.1/あいうえお'},
    ]);
    expect(chapter.subchapters.length).toBe(0);
  });
  test('chapter1', () => {
    const chapter = actual.subchapters[0].subchapters[1];
    expect(chapter.title).toBe('chapter1');
    expect(chapter.contents.length).toBe(1);
    expect(chapter.contents).toEqual([
      {title: '仕様1', link: 'chapter1/仕様1'},
    ]);
    expect(chapter.subchapters.length).toBe(0);
  });
});

