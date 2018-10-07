Swagger Petstore
================
This is a sample server Petstore server.  You can find out more about Swagger at [http://swagger.io](http://swagger.io) or on [irc.freenode.net, #swagger](http://swagger.io/irc/).  For this sample, you can use the api key `special-key` to test the authorization filters.

**Version:** 1.0.0

**Terms of service:**  
http://swagger.io/terms/

**Contact information:**  
apiteam@swagger.io  

**License:** [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0.html)

[Find out more about Swagger](http://swagger.io)
### Security
---
**petstore_auth**  

|oauth2|*OAuth 2.0*|
|---|---|
|Authorization URL|https://petstore.swagger.io/oauth/dialog|
|Flow|implicit|
|**Scopes**||
|write:pets|modify pets in your account|
|read:pets|read your pets|

**api_key**  

|apiKey|*API Key*|
|---|---|
|Name|api_key|
|In|header|

### /store/inventory
---
##### ***GET***
**Summary:** Returns pet inventories by status

**Description:** Returns a map of status codes to quantities

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | successful operation | object |

**Security**

| Security Schema | Scopes |
| --- | --- |
| api_key | |

### /store/order
---
##### ***POST***
**Summary:** Place an order for a pet

**Description:** 

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| body | body | order placed for purchasing the pet | Yes | [Order](#order) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | successful operation | [Order](#order) |
| 400 | Invalid Order |  |

### /store/order/{orderId}
---
##### ***GET***
**Summary:** Find purchase order by ID

**Description:** For valid response try integer IDs with value >= 1 and <= 10. Other values will generated exceptions

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| orderId | path | ID of pet that needs to be fetched | Yes | long |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | successful operation | [Order](#order) |
| 400 | Invalid ID supplied |  |
| 404 | Order not found |  |

##### ***DELETE***
**Summary:** Delete purchase order by ID

**Description:** For valid response try integer IDs with positive integer value. Negative or non-integer values will generate API errors

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| orderId | path | ID of the order that needs to be deleted | Yes | long |

**Responses**

| Code | Description |
| ---- | ----------- |
| 400 | Invalid ID supplied |
| 404 | Order not found |

### Models
---

### Order  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | long |  | No |
| petId | long |  | No |
| quantity | integer |  | No |
| shipDate | dateTime |  | No |
| status | string | Order Status | No |
| complete | boolean |  | No |

### Category  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | long |  | No |
| name | string |  | No |

### Tag  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | long |  | No |
| name | string |  | No |

### User  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | long |  | No |
| username | string |  | No |
| firstName | string |  | No |
| lastName | string |  | No |
| email | string |  | No |
| password | string |  | No |
| phone | string |  | No |
| userStatus | integer | User Status | No |

### Pet  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | long |  | No |
| category | [Category](#category) |  | No |
| name | string |  | Yes |
| photoUrls | [ string ] |  | Yes |
| tags | [ [Tag](#tag) ] |  | No |
| status | string | pet status in the store | No |

### ApiResponse  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| code | integer |  | No |
| type | string |  | No |
| message | string |  | No |