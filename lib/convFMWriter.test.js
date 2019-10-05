'use strict';

const fs = require('fs-extra');
const path = require('path');

const fixtureDir = (path.resolve('')+'/lib/__tests__/fixture').replace(/\\/g, '/');
const outtmpDir = (path.resolve('')+'/.tmp').replace(/\\/g, '/');
const tmpDocrootDir = outtmpDir + '/docroot';
 
const a5conf = require('./conf');
const a5util = require('./util');
const convFMWriter = require('./convFMWriter');
const frontMatter = require('front-matter');

a5conf._extend({
  // ドキュメントのrootディレクトリ
  docroot: '.tmp/docroot',
  // ドキュメントのスタイル (wiki | md | gitbook)
  docstyle: 'wiki',
});

describe('writeAll', () => {
  test('ファイル走査のテスト', () => {
    fs.removeSync(tmpDocrootDir);
    fs.copySync(fixtureDir+'/front-matter', tmpDocrootDir, {
      clobber: true, 
      filter: function (element) {
        return true;
      }
    });
    convFMWriter.writeAll();
    const mdfiles = a5util.findFilesGlob(tmpDocrootDir+'/**/*.md').sort();
    expect(Object.keys(mdfiles).length).toBe(3);
  
    // 最初の1つだけ出力結果をテスト
    const mdtext = fs.readFileSync(mdfiles[0], 'utf8');
    const lines = mdtext.split(/\r?\n/);
    let i = 0;
    expect(lines[i++]).toBe('---');
    expect(lines[i++]).toBe('title: TOP');
    expect(lines[i++]).toBe("category: ''");
    expect(lines[i++]).toBe('---');
    expect(lines[i++]).toBe('');
    expect(lines[i++]).toBe('# ほげシステム');
  });
});

describe('convert', () => {
  test('すでにfront-matterがあるとき変換されてない', () => {
    const mdtext = `---
title: HOGE
---

テスト
`;
    const result = convFMWriter.convert(mdtext, 'hoge.md');
    expect(result).toBe(false);
  });

  test('docroot直下のカテゴリ抽出と既存bodyの内容がオリジナルのとおり', () => {
    const mdtext = `# test`;
    const docPath = path.join(tmpDocrootDir, '文書1.md');
    const result = convFMWriter.convert(mdtext, docPath);
    const fm = frontMatter(result);
    expect(fm.attributes.title).toBe('文書1');
    expect(fm.attributes.category).toBe('');
    expect(fm.body).toBe(mdtext);
  });
  
  test('カテゴリが1つ', () => {
    const mdtext = `# test`;
    const docPath = path.join(tmpDocrootDir, 'カテ1/文書1.md');
    const result = convFMWriter.convert(mdtext, docPath);
    const fm = frontMatter(result);
    expect(fm.attributes.title).toBe('文書1');
    expect(fm.attributes.category).toBe('カテ1');
    expect(fm.body).toBe(mdtext);
  });
  
  test('カテゴリが2つ', () => {
    const mdtext = `# test`;
    const docPath = path.join(tmpDocrootDir, 'カテ1/カテ2/文書1.md');
    const result = convFMWriter.convert(mdtext, docPath);
    const fm = frontMatter(result);
    expect(fm.attributes.title).toBe('文書1');
    expect(JSON.stringify(fm.attributes.category)).toBe(JSON.stringify(['カテ1', 'カテ2']));
    expect(fm.body).toBe(mdtext);
  });

});
