<%
function outputChapter(chapter, level) {
  if (chapter.title) {
    const bol = mdUtil.listIndent(level);
    if (chapter.collapse) {
-%>
<%- bol.fisrtIndent %><details><summary><%- chapter.title %></summary>

<%
      // details/summaryを使うときに、</summary>のあとに
      // 空行を1行入れないと表示がおかしくなる
    } else {
-%>
<%- bol.fisrtIndent + mdUtil.mdLink(chapter.title, chapter.link) %>  
<%
    }
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
  if (chapter.title && chapter.collapse) {
    const bol = mdUtil.listIndent(level);
    // </details>の前にも空行を入れる（入れなくても問題はないのだが）
-%>

<%- bol.secondIndent %></details>
<%
  }
}
chapters.forEach((chapter) => {
  outputChapter(chapter, 0);
});
-%>
