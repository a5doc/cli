'use strict';

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const _ = require('lodash');

const fixtureDir = (path.resolve('')+'/lib/__tests__/fixture').replace(/\\/g, '/');
const outtmpDir = (path.resolve('')+'/.tmp').replace(/\\/g, '/');
const tmpDocrootDir = outtmpDir + '/docroot';
 
const a5conf = require('./conf');
const a5util = require('./util');
const swaggerWriter = require('./swaggerWriter');

a5conf._extend({
  // ドキュメントのrootディレクトリ
  docroot: '.tmp/docroot',
  // swagger
  swagger: {
    src: [
      '**/*.yml',
      '!swagger.*',
      '!common.yml',
    ],
    dst: '',
    common: 'common.yml',
    merge: [
      'swagger.yml',
      'swagger.json'
    ],
  },
});

describe('writeAll', () => {
  fs.removeSync(tmpDocrootDir);
  fs.copySync(fixtureDir+'/swagger', tmpDocrootDir, {
    clobber: true, 
    filter: function (element) {
      return true;
    }
  });
  swaggerWriter.writeAll();

  const swaggerfiles = a5util.findFilesGlob(tmpDocrootDir+'/swagger.*');
  test('作成された swagger file', () => {
    expect(Object.keys(swaggerfiles).length).toBe(2);
  });
  const swagger = yaml.safeLoad(fs.readFileSync(tmpDocrootDir+'/swagger.yml'));
  const swaggerjson = JSON.parse(fs.readFileSync(tmpDocrootDir+'/swagger.json'));
  test('swaggerの中身が同じ', () => {
    expect(swagger).toEqual(swaggerjson);
  });
  test('マージされたswaggerのpaths', () => {
    const properties = Object.keys(swagger.paths);
    expect(properties.length).toBe(4);
    // pathsの並び順
    expect(properties[0]).toBe('/ooo');
    expect(properties[1]).toBe('/pet1');
    expect(properties[2]).toBe('/pet2');
    expect(properties[3]).toBe('/qqq');
  });
  test('マージされたswaggerのリクエストメソッド', () => {
    // リクエストメソッドの並び順
    const properties = Object.keys(swagger.paths['/pet1']);
    expect(properties.length).toBe(4);
    expect(properties[0]).toBe('get');
    expect(properties[1]).toBe('post');
    expect(properties[2]).toBe('put');
    expect(properties[3]).toBe('delete');
  });
  test('common.ymlが最後にマージされている', () => {
    expect(swagger.info.version).toBe('COMMON-VER');
    expect(swagger.schemes).toEqual(['https']);
  });

  const mdfiles = a5util.findFilesGlob(tmpDocrootDir+'/*.md');
  test('作成された md', () => {
    expect(Object.keys(mdfiles).length).toBe(2);
    expect(mdfiles[0]).toMatch(/test1.md$/);
    expect(mdfiles[1]).toMatch(/test2.md$/);
  });
});
