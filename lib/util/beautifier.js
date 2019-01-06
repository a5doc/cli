'use strict';

const prettier = require('prettier');
const beautify = require('js-beautify');
const _ = require('lodash');

module.exports.formatTs = function(text, options) {
  const prettierOptions = _.merge({
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
    parser: 'typescript',
  }, options);
  return prettier.format(text, prettierOptions);
};

module.exports.formatJson = function(text, options) {
  const prettierOptions = _.merge({
    parser: 'json',
  }, options);
  return prettier.format(text, prettierOptions);
};

module.exports.formatScss = function(text, options) {
  const prettierOptions = _.merge({
    parser: 'scss',
  }, options);
  return prettier.format(text, prettierOptions);
};

module.exports.formatHtml = function(text, options) {
  const beautifyOptions = _.merge({
    indent_size: 2,
    // 出力の最後に改行を出力する
    end_with_newline: true,
    // 
    // wrap_attributes: 'force-aligned',
    wrap_attributes: 'force-expand-multiline',
    wrap_line_length: 80,
  }, options);
  return beautify.html(text, beautifyOptions);
};

module.exports.formatMd = function(text, options) {
  const prettierOptions = _.merge({
    parser: 'markdown',
  }, options);
  return prettier.format(text, prettierOptions);
};
