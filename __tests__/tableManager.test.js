'use strict';

const fs = require('fs-extra');

const a5conf = require('../lib/conf')({
  table: {
    src: './__tests__/fixture/simple-table/**/*.yml',
    output: './.tmp/table-md'
  }
});
const tableManager = require('../lib/tableManager');
const a5util = require('../lib/util');

test('read table yml', () => {
  const actual = tableManager.readAll();
  expect(Object.keys(actual).length).toBe(3);
  expect(actual['table1'].id).toBe('table1');
  expect(actual['table2'].id).toBe('table2');
  expect(actual['table3'].id).toBe('table3');
});

test('MDファイルの出力', () => {
  fs.removeSync(a5conf.table.output);
  tableManager.writeMdAll();
  const outdir = a5conf.table.output;
  const mdfiles = a5util.findFilesGlob(outdir+'/**/*.md');
  expect(Object.keys(mdfiles).length).toBe(3);
  expect(mdfiles).toContain(outdir + '/テーブル1.md');
  expect(mdfiles).toContain(outdir + '/テーブル2.md');
  expect(mdfiles).toContain(outdir + '/テーブル3.md');

  const mdtext = fs.readFileSync(outdir + '/テーブル1.md', 'utf8');
  // ドキュメントヘッダーの確認
  expect(mdtext.split(/\n/)[0])
    .toMatch(/ドキュメント\|テーブルID\|テーブル名/);
  expect(mdtext.split(/\n/)[2])
    .toMatch(/テーブル定義\|table1    \|テーブル1/);
  // カラムの定義表の1行を確認
  expect(mdtext)
    .toMatch(/カラム1\|column1\|○\|1 \|varchar\|100   \|    \|○      \|/);
  // autoIncrementの備考反映の確認
  expect(mdtext)
    .toMatch(/ID.*|オートナンバー$/);
  // 備考1行の確認
  expect(mdtext)
    .toMatch(/カラム2.*|備考1行$/);
  // 備考2行の確認(脚注に転記されている)
  expect(mdtext)
    .toMatch(/カラム3.*|\[※1\]\(#columnSpecFootNote1\)$/);
  expect(mdtext)
    .toMatch(/\*\*※1\*\*\s+備考1行\s+備考2行/m);
  // インデックスの定義表の1行を確認
  expect(mdtext)
    .toMatch(/1 \|uk_index1     \|○      \|column1<br>column2/);
  const mdtext2 = fs.readFileSync(outdir + '/テーブル2.md', 'utf8');
  // autoIncrementのと備考の両方があるときの確認
  expect(mdtext2)
    .toMatch(/ID.*|オートナンバー<br>備考1行/);
  const mdtext3 = fs.readFileSync(outdir + '/テーブル3.md', 'utf8');
  // autoIncrementのと備考の両方があるときの確認
  expect(mdtext3)
    .toMatch(/ID.*|オートナンバー<br>\[※1\]\(#columnSpecFootNote1\)/);
  expect(mdtext3)
    .toMatch(/\*\*※1\*\*\s+備考1行\s+備考2行/m);
});
