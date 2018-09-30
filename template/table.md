<%- docHead %>

<% if (table.description && table.description != '') { -%>
# 概要

<%- table.description %>

<% } -%>
# テーブル

<%- columnSpec %>

<% /* 表外の補足説明 */
if (columnSpecFootNotes) {
  columnSpecFootNotes.forEach((footNote) => {
-%>

<a name="<%= footNote.index %>"></a>
**<%= footNote.label %>**  
<%= footNote.desc %>  
<%
  });
} -%>

<% if (indexSpec != '') { -%>
# インデックス

<%- indexSpec %>
<% } -%>
