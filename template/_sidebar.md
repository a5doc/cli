<%
function outputChapter(chapter, level) {
  let collapseStart1 = '';
  let collapseStart2 = '';
  let collapseEnd = '';
  if (chapter.title && level > 0) {
    const indent = level - 1;
    const mark = level <= 1 ? '*': '-';
    const sp = ' '.repeat(indent * 4);
    if (chapter.collapse) {
      collapseStart1 = '<details><summary>';
      collapseStart2 = '</summary>\n';
      collapseEnd = sp + '  </details>';
    }
-%>
<%- sp + mark + ' ' + collapseStart1 + chapter.title + collapseStart2 %>  
<%
  }
  if (chapter.contents) {
    const indent = level === 0 ? 0: level;
    const mark = level <= 0 ? '*': '-';
    const sp = ' '.repeat(indent * 4);
    chapter.contents.forEach((content) => {
-%>
<%- sp + mark %> [<%- content.title %>](<%- mdUtil.escapeLink(content.link) %>)  
<%
    });
  }
  if (chapter.subchapters) {
    chapter.subchapters.forEach((subchapter) => {
      outputChapter(subchapter, level+1);
    });
  }
  if (chapter.collapse) {
-%>
<%- collapseEnd %>  
<%
  }
}

outputChapter(chapterRoot, 0);
-%>
