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
  chapters: [
    {
      title: 'Top',
      src: 'TOP.md',
    },
    {
      title: 'chapter0',
      chapters: [
        {
          title: 'chapter2',
          src: 'chapter2/*.md',
          chapters: [{
            title: 'chapter2.0',
            dir: 'chapter2',
            src: [
              '**/*.md',
              '!仕様*.md'
            ],
          }],
        },
        {
          title: 'chapter1',
          src: 'chapter1/**/*.md',
        }
      ]
    }
  ]
});

describe('getChapters', () => {
  fs.removeSync(tmpDocrootDir);
  fs.copySync(fixtureDir+'/sidebar', tmpDocrootDir, {
    clobber: true, 
    filter: function (element) {
      return true;
    }
  });
  const actuals = chapterIndexer.getChapters();
  test('chapter length', () => {
    expect(actuals.length).toBe(2);
  });
  test('top chapter', () => {
    const chapter = actuals[0];
    expect(chapter.title).toBe('Top');
    expect(chapter.link).toBe('TOP');
    expect(chapter.contents.length).toBe(0);
    expect(chapter.chapters.length).toBe(0);
  });
  test('chapter0', () => {
    const chapter = actuals[1];
    expect(chapter.title).toBe('chapter0');
    expect(chapter.contents.length).toBe(0);
    expect(chapter.chapters.length).toBe(2);
  });
  test('chapter2', () => {
    const chapter = actuals[1].chapters[0];
    expect(chapter.title).toBe('chapter2');
    expect(chapter.contents.length).toBe(2);
    expect(chapter.contents).toEqual([
      {title: '仕様2', link: 'chapter2/仕様2'},
      {title: '仕様3', link: 'chapter2/仕様3'},
    ]);
    expect(chapter.chapters.length).toBe(1);
  });
  test('chapter2.0', () => {
    const chapter = actuals[1].chapters[0].chapters[0];
    expect(chapter.title).toBe('chapter2.0');
    expect(chapter.contents.length).toBe(0);
    expect(chapter.chapters.length).toBe(1);
  });
  test('章2.1', () => {
    const chapter = actuals[1].chapters[0].chapters[0].chapters[0];
    expect(chapter.title).toBe('章2.1');
    expect(chapter.contents.length).toBe(1);
    expect(chapter.chapters.length).toBe(0);
    expect(chapter.contents).toEqual([
      {title: 'あいうえお', link: 'chapter2/章2.1/あいうえお'},
    ]);
  });
  test('chapter1', () => {
    const chapter = actuals[1].chapters[1];
    expect(chapter.title).toBe('chapter1');
    expect(chapter.contents.length).toBe(3);
    expect(chapter.contents).toEqual([
      {title: '仕様1', link: 'chapter1/仕様1'},
      {title: 'かきくけこ', link: 'chapter1/章1.1/かきくけこ'},
      {title: 'さしすせそ', link: 'chapter1/章1.2/さしすせそ'},
    ]);
    expect(chapter.chapters.length).toBe(0);
  });
});

