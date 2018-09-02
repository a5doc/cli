'use strict';

/**
 * MDの書式を整形する。  
 * 
 * @param {string} text MDのテキスト
 * @returns 整形されたテキスト
 */
module.exports.fixes = function(text) {
  return text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n');
}
