<% if (chapterRoot.title) { -%>
<%= chapterRoot.title %>

<% } -%>
<%
function outputChapter(chapter, level) {
  if (chapter.title && level > 0) {
    const indent = level - 1;
    const mark = level <= 1 ? '*': '-';
    const sp = ' '.repeat(indent * 4);
-%>
<%- sp + mark + ' ' + chapter.title %>  
<%
  }
  if (chapter.contents) {
    const indent = level === 0 ? 0: level;
    const mark = level <= 0 ? '*': '-';
    const sp = ' '.repeat(indent * 4);
    chapter.contents.forEach((content) => {
-%>
<%- sp + mark %> [<%- content.title %>](<%- content.link %>)  
<%
    });
  }
  if (chapter.subchapters) {
    Object.values(chapter.subchapters).forEach((subchapter) => {
      outputChapter(subchapter, level+1);
    });
  }
}

outputChapter(chapterRoot, 0);
-%>
