'use strict';

const fs = require('fs-extra');
const path = require('path');

const fixtureDir = (path.resolve('')+'/lib/__tests__/fixture').replace(/\\/g, '/');
const outtmpDir = (path.resolve('')+'/.tmp').replace(/\\/g, '/');
const tmpDocrootDir = outtmpDir + '/docroot';
 
const a5conf = require('../conf');
const a5util = require('../util');
const sidebarWriter = require('../sidebarWriter');

a5conf._extend({
  // ドキュメントのrootディレクトリ
  docroot: '.tmp/docroot',
  // ドキュメントのスタイル (wiki | md | gitbook)
  docstyle: 'wiki',
  // 目次
  docindex: {
    title: '目次',
    indexer: 'mdFileIndexer',
  },
});

test('write sidebar', () => {
  fs.removeSync(tmpDocrootDir);
  fs.copySync(fixtureDir+'/sidebar', tmpDocrootDir, {
    clobber: true, 
    filter: function (element) {
      return true;
    }
  });
  sidebarWriter.write();
  // 作成された_sidebar.md
  const mdfiles = a5util.findFilesGlob(tmpDocrootDir+'/_sidebar.md');
  expect(Object.keys(mdfiles).length).toBe(1);

  const mdtext = fs.readFileSync(mdfiles[0], 'utf8');
  const lines = mdtext.split(/[\n]/);
  expect(lines[0]).toBe('* [TOP](./TOP)  ');
  expect(lines[1]).toBe('* chapter1  ');
  expect(lines[2]).toBe('    - [仕様1](chapter1/仕様1)  ');
  expect(lines[3]).toBe('* chapter2  ');
  expect(lines[4]).toBe('    - [仕様2](chapter2/仕様2)  ');
  expect(lines[5]).toBe('    - 章2.1  ');
  expect(lines[6]).toBe('        - [あいうえお](chapter2/章2.1/あいうえお)  ');
});

test('write sidebar wiki', () => {
  fs.removeSync(tmpDocrootDir);
  fs.copySync(fixtureDir+'/sidebar', tmpDocrootDir, {
    clobber: true, 
    filter: function (element) {
      return true;
    }
  });
  a5conf._extend({
    // ドキュメントのスタイル (wiki | md | gitbook)
    docstyle: 'md',
  });
  sidebarWriter.write();
  // 作成された_sidebar.md
  const mdfiles = a5util.findFilesGlob(tmpDocrootDir+'/_sidebar.md');
  expect(Object.keys(mdfiles).length).toBe(1);

  const mdtext = fs.readFileSync(mdfiles[0], 'utf8');
  const lines = mdtext.split(/[\n]/);
  expect(lines[0]).toBe('* [TOP](./TOP.md)  ');
});
