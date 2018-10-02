'use strict';

const fs = require('fs-extra');
const path = require('path');

const fixtureDir = (path.resolve('')+'/lib/__tests__/fixture').replace(/\\/g, '/');
const outtmpDir = (path.resolve('')+'/.tmp').replace(/\\/g, '/');
const tmpDocrootDir = outtmpDir + '/docroot';
 
const a5conf = require('../conf');
const a5util = require('../util');
const dirnameIndexer = require('./dirnameIndexer');

a5conf._extend({
  // ドキュメントのrootディレクトリ
  docroot: '.tmp/docroot',
  // 目次
  sidebar: {
    title: '目次',
  },
});

describe('getChapters', () => {
  fs.removeSync(tmpDocrootDir);
  fs.copySync(fixtureDir+'/sidebar', tmpDocrootDir, {
    clobber: true, 
    filter: function (element) {
      return true;
    }
  });
  const actuals = dirnameIndexer.getChapters();

  test('chapter length', () => {
    expect(actuals.length).toBe(3);
  });
  test('top chapter', () => {
    const chapter = actuals[0];
    expect(chapter.title).toEqual(null);
    expect(chapter.contents).toEqual([
      {title: 'TOP', link: 'TOP'},
    ]);
    expect(chapter.chapters.length).toBe(0);
  });
  test('chapter1', () => {
    const chapter = actuals[1];
    expect(chapter.title).toBe('chapter1');
    expect(chapter.contents.length).toBe(1);
    expect(chapter.contents).toEqual([
      {title: '仕様1', link: 'chapter1/仕様1'},
    ]);
    expect(chapter.chapters.length).toBe(2);
  });
  test('chapter2', () => {
    const chapter = actuals[2];
    expect(chapter.title).toBe('chapter2');
    expect(chapter.contents.length).toBe(2);
    expect(chapter.contents).toEqual([
      {title: '仕様2', link: 'chapter2/仕様2'},
      {title: '仕様3', link: 'chapter2/仕様3'},
    ]);
    expect(chapter.chapters.length).toBe(1);
  });
  test('章2.1', () => {
    const chapter = actuals[2].chapters[0];
    expect(chapter.title).toBe('章2.1');
    expect(chapter.contents.length).toBe(1);
    expect(chapter.contents).toEqual([
      {title: 'あいうえお', link: 'chapter2/章2.1/あいうえお'},
    ]);
    expect(chapter.chapters.length).toBe(0);
  });
});

