'use strict';

const fs = require('fs-extra');
const path = require('path');

const fixtureDir = (path.resolve('')+'/lib/__tests__/fixture').replace(/\\/g, '/');;
const outtmpDir = (path.resolve('')+'/.tmp').replace(/\\/g, '/');
 
const a5conf = require('./conf');
const erdOutDir = outtmpDir+'/erd';
a5conf._extend({
  table: {
    src: fixtureDir+'/simple-table/**/*.yml',
    tableMdDir: outtmpDir+'/table-md',
    erd: [
      {
        id: 'ER-001',
        docTitle: 'ER図001',
        description: '概要コメント001',
        path: erdOutDir+'/er-001.md',
        // 表示するテキスト形式
        // logical=論理名 | physical=物理名 | both=物理名+論理名
        labelType: 'logical',
        // 作図するテーブルを指定
        entityPatterns: [
          // id=テーブルIDの正規表現
          // columnType=表示するカラムタイプ
          // all=全カラムを表示 | no=カラムなし | pk=PKのみ | pk+uk=PKとUKのみ
          {
            id: '.*',
            columnType: 'all',
          }
        ]
      },
      {
        id: 'ER-002',
        docTitle: 'ER図002',
        description: '概要コメント002',
        path: erdOutDir+'/er-002.md',
        labelType: 'physical',
        entityPatterns: [
          {
            id: 'table2',
            columnType: 'pk',
          },
          {
            id: '(table1|table3)',
            columnType: 'all',
          }
        ]
      },
      {
        id: 'ER-003',
        docTitle: 'ER図003',
        description: '概要コメント003',
        path: erdOutDir+'/er-003.md',
        labelType: 'both',
        entityPatterns: [
          {
            id: 'table1',
            columnType: 'pk+uk',
          },
          {
            id: 'table2',
            columnType: 'no',
          }
        ]
      },
      {
        id: 'ER-004',
        docTitle: 'ER図004',
        description: '概要コメント004',
        path: erdOutDir+'/er-004.md',
        labelType: 'physical',
        entityPatterns: [
          {
            id: 'table1',
            columnType: 'no',
          },
          {
            id: 'table3',
            columnType: 'no',
          }
        ]
      },
    ]
  }
});

const a5util = require('./util');
const erdWriter = require('./erdWriter');

test('write erd', () => {
  fs.removeSync(erdOutDir);
  erdWriter.writeAll();
  // 作成されたER図のMDファイルの数が正しい
  const mdfiles = a5util.findFilesGlob(erdOutDir+'/**/*.md');
  expect(Object.keys(mdfiles).length).toBe(4);

  const erd = a5conf.get().table.erd;
  const mdtext = erd.map((erdItem) => {
    return fs.readFileSync(erdItem.path, 'utf8');
  });

  // ドキュメントヘッダー
  expect(mdtext[0].split(/\n/)[2]).toMatch(/ER図 *\|ER-001 *\|ER図001 */);
  // 概要
  expect(mdtext[0]).toMatch(/概要コメント001\s+/);

  // labelTypeのテスト / entiry名
  // logical
  expect(mdtext[0]).toMatch(/entity "テーブル2" \{/);
  // physical
  expect(mdtext[1]).toMatch(/entity table2 \{/);
  // both
  expect(mdtext[2]).toMatch(/entity "table2 テーブル2" \{/);

  // labelTypeのテスト / column名
  // logical
  expect(mdtext[0]).toMatch(/\+ ID \[PK\]/m);
  // physical
  expect(mdtext[1]).toMatch(/\+ id \[PK\]/m);
  // both
  expect(mdtext[2]).toMatch(/\+ id ID \[PK\]/m);
  
  // entityPatterns / id のテスト 
  // entityの出現数でidのテーブル名に対する正規表現が機能していることを確認
  expect(mdtext[0].match(/entity.*?\{/g).length).toBe(3);
  expect(mdtext[1].match(/entity.*?\{/g).length).toBe(3);
  expect(mdtext[2].match(/entity.*?\{/g).length).toBe(2);

  // entityPattern.columnType のテスト
  // all = 全カラム名がある
  {
    const matches = mdtext[1].match(/entity table1 \{([^\}]+)\}/);
    expect(matches[1]).toMatch(/ id\s/m);
    expect(matches[1]).toMatch(/ column1\s/m);
    expect(matches[1]).toMatch(/ column2\s/m);
    expect(matches[1]).toMatch(/ column3\s/m);
  }
  // no=カラムなし
  {
    const matches = mdtext[2].match(/entity "table2 テーブル2" \{([^\}]+)\}/);
    expect(matches[1]).not.toMatch(/ id\s/m);
    expect(matches[1]).not.toMatch(/ column21\s/m);
    expect(matches[1]).not.toMatch(/ column22\s/m);
  }
  // pk=PKのみ
  {
    const matches = mdtext[1].match(/entity table2 \{([^\}]+)\}/);
    expect(matches[1]).toMatch(/ id\s/m);
    expect(matches[1]).not.toMatch(/ column21\s/m);
    expect(matches[1]).not.toMatch(/ column22\s/m);
  }
  // pk+uk=PKとUKのみ
  {
    const matches = mdtext[2].match(/entity "table1 テーブル1" \{([^\}]+)\}/);
    expect(matches[1]).toMatch(/ id\s/m);
    expect(matches[1]).toMatch(/ column1\s/m);
    expect(matches[1]).toMatch(/ column2\s/m);
    expect(matches[1]).not.toMatch(/ column3\s/m);
  }

  // relationshipのテスト
  expect(mdtext[0]).toMatch(/"テーブル3" \}o-- "テーブル2"/);
  expect(mdtext[0]).toMatch(/"テーブル3" \|o-- "テーブル1"/);
  expect(mdtext[1]).toMatch(/table3 \}o-- table2/);
  expect(mdtext[1]).toMatch(/table3 \|o-- table1/);
  expect(mdtext[3]).not.toMatch(/table3 \}o-- table2/);
  expect(mdtext[3]).toMatch(/table3 \|o-- table1/);
});
