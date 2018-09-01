'use strict';

const fs = require('fs-extra');
const path = require('path');
const fixtureDir = (path.resolve('')+'/lib/__tests__/fixture').replace(/\\/g, '/');;
const outtmpDir = (path.resolve('')+'/.tmp').replace(/\\/g, '/');
 
const a5conf = require('../conf');
a5conf._extend({
  table: {
    src: fixtureDir+'/simple-table/**/*.yml',
    tableMdDir: outtmpDir+'/table-md',
  }
});

const tableManager = require('../tableManager');
const a5util = require('../util');


test('read table yml', () => {
  const actual = tableManager.readAll();
  expect(Object.keys(actual).length).toBe(3);
  expect(actual['table1'].id).toBe('table1');
  expect(actual['table2'].id).toBe('table2');
  expect(actual['table3'].id).toBe('table3');
});

test('MDファイルの出力', () => {
  const conf = a5conf.get();
  fs.removeSync(conf.table.tableMdDir);
  tableManager.writeMdAll();
  const outdir = conf.table.tableMdDir;
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

test('write erd', () => {
  const erdOutDir = outtmpDir+'/erd';
  a5conf._extend({
    table: {
      src: fixtureDir+'/simple-table/**/*.yml',
      tableMdDir: outtmpDir+'/table-md',
      erd: [
        {
          docId: 'ER-001',
          docTitle: 'ER図（全体）',
          description: 'システム全体のER図',
          path: erdOutDir+'/er-001.md',
          // 表示するテキスト形式
          // logical=論理名 | physical=物理名 | p+l=物理名+論理名
          labelType: 'logical',
          // 作図するテーブルを指定
          entities: [
            // idPattern=テーブルIDの正規表現
            // columnType=表示するカラムタイプ
            // all=全カラムを表示 | no=カラムなし | pk=PKのみ | pk_uk=PKとUKのみ | noaudit=Auditフィールド以外 
            {
              idPattern: '.*',
              columnType: 'all',
            }
          ]
        },
        {
          docId: 'ER-002',
          docTitle: 'ER図（顧客）',
          description: '顧客を中心にしたER図',
          path: erdOutDir+'/er-002.md',
          labelType: 'p+l',
          entities: [
            {
              idPattern: 'm_account.*',
              columnType: 'pk',
            },
            {
              idPattern: 'm_customer',
              columnType: 'all',
            }
          ]
        },
      ]
    }
  });
  fs.removeSync(erdOutDir);
  tableManager.writeMdAll();
  const mdfiles = a5util.findFilesGlob(erdOutDir+'/**/*.md');
  expect(Object.keys(mdfiles).length).toBe(0);
});
