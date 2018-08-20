'use strict';

/**
 * MDのテーブルをフォーマットする。  
 * テキストのままでも表を視認できるように、
 * 余白をパディングして罫線'|'の位置を揃える
 * 
 * @param {string[][]} rows 表の配列。1行目はヘッダー。
 * @returns フォーマットされたテキスト
 */
module.exports.format = function(rows) {
  if (rows.length === 0) {
    return '';
  }
  var columnLengths = countColumnLength(rows);
  paddingCells(columnLengths, rows);
  headBodyPartitionLine(columnLengths, rows);
  return formatMdTable(rows);
}

/**
 * MDのテーブルとして出力する
 */
function formatMdTable(rows) {
  var text = '';
  for (var y=0; y < rows.length; ++y) {
    text += rows[y].join('|') + '\n';
  }
  return text;
}

/**
 * ヘッダー行の下に仕切り線を挿入する
 */
function headBodyPartitionLine(columnLengths, rows) {
  var cells = [];
  for (var x=0; x < columnLengths.length; ++x) {
    cells.push('-'.repeat(columnLengths[x]));
  }
  rows.splice(1, 0, cells);
}

/**
 * セルの列幅が同じになるように、paddingChar で埋める
 */
function paddingCells(columnLengths, rows, paddingChar) {
  if (!paddingChar) {
    paddingChar = ' ';
  }
  for (var y=0; y < rows.length; ++y) {
    for (var x=0; x < rows[y].length; ++x) {
      var width = columnLengths[x];
      var paddingLen = width - mstrlen(rows[y][x]);
      rows[y][x] = rows[y][x] + paddingChar.repeat(paddingLen);
    }
  }
}

/**
 * 文字数をカウントする。
 * 全角を2文字、半角を1文字でカウントする。
 * バイト数ということではなくて、等幅フォントで表示したときに、
 * 表示位置を揃えるためのもの。
 */
function mstrlen(str) {
  if (typeof(str) === 'undefined') {
    str = '';
  }
  var r = 0;
  str = str.toString();
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    if ((c >= 0x0 && c < 0x81) ||
        (c == 0xf8f0) ||
        (c >= 0xff61 && c < 0xffa0) ||
        (c >= 0xf8f1 && c < 0xf8f4)) {
      r += 1;
    } else {
      r += 2;
    }
  }
  return r;
}

/**
 * 列毎の最大文字数を数える
 * @returns {number[]} 列毎の最大文字数の配列。
 */
function countColumnLength(rows) {
  // 列数をカウント
  var columnCount = 0;
  rows.forEach((row) => {
    if (columnCount < row.length) {
      columnCount = row.length;
    }
  });
  var columnLengths = [];
  for (var i=0; i < columnCount; i++) {
    var maxLen = 0;
    rows.forEach((row) => {
      if (!row[i]) {
        row[i] = '';
      }
      var len = mstrlen(row[i]);
      if (len > maxLen) {
        maxLen = len;
      }
    });
    columnLengths.push(maxLen);
  }
  return columnLengths;
}
