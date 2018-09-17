# Summary

<%
function outputChapter(chapter, level) {
  if (chapter.title) {
    const bol = mdUtil.listIndent(level);
-%>
<%- bol.fisrtIndent + mdUtil.mdLink(chapter.title, chapter.link) %>  
<%
  }
  if (chapter.contents) {
    // 見出し（chapter.title）がないときは、
    // インデントを見出しと同じにする
    const bol = mdUtil.listIndent(chapter.title ? (level + 1): level);
    chapter.contents.forEach((content) => {
-%>
<%- bol.fisrtIndent + mdUtil.mdLink(content.title, content.link) %>  
<%
    });
  }
  if (chapter.chapters) {
    chapter.chapters.forEach((subchapter) => {
      outputChapter(subchapter, level+1);
    });
  }
}
chapters.forEach((chapter) => {
  outputChapter(chapter, 0);
});
-%>
