<%- docHead %>

<% if (table.description && table.description != '') { -%>
# 概要

<%- table.description %>

<% } -%>
# テーブル

<%- columnSpec %>

<% /* 表外の補足説明 */
if (columnSpecFootNotes) {
  columnSpecFootNotes.forEach((note) => {
-%>
<a name="<%= note.index %>"></a>
**<%= note.label %>**  
<%= note.note %>  
<%
  });
} -%>

<% if (indexSpec != '') { -%>
# インデックス

<%- indexSpec %>
<% } -%>
