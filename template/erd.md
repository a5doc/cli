<%- docHead %>

<% if (erd.description && erd.description != '') {%>
<%- erd.description %>
<% } %>

```plantuml
@startuml 
<% entities.forEach((entity) => { -%>

entity <%- entity.entityName %> {
<%   entity.columnRows.forEach((columnRow) => { -%>
    <%- columnRow %>
<%   }); -%>
}
<% }); -%>

<% relationshipRows.forEach((relationshipRow) => { -%>
<%- relationshipRow %>
<% }); -%>
@enduml
```
