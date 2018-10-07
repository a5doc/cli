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

### /pet
---
##### ***POST***
**Summary:** Add a new pet to the store

**Description:** 

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| body | body | Pet object that needs to be added to the store | Yes | [Pet](#pet) |

**Responses**

| Code | Description |
| ---- | ----------- |
| 405 | Invalid input |

**Security**

| Security Schema | Scopes | |
| --- | --- | --- |
| petstore_auth | write:pets | read:pets |

##### ***PUT***
**Summary:** Update an existing pet

**Description:** 

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| body | body | Pet object that needs to be added to the store | Yes | [Pet](#pet) |

**Responses**

| Code | Description |
| ---- | ----------- |
| 400 | Invalid ID supplied |
| 404 | Pet not found |
| 405 | Validation exception |

**Security**

| Security Schema | Scopes | |
| --- | --- | --- |
| petstore_auth | write:pets | read:pets |

### /pet/findByStatus
---
##### ***GET***
**Summary:** Finds Pets by status

**Description:** Multiple status values can be provided with comma separated strings

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| status | query | Status values that need to be considered for filter | Yes | [ string ] |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | successful operation | [ [Pet](#pet) ] |
| 400 | Invalid status value |  |

**Security**

| Security Schema | Scopes | |
| --- | --- | --- |
| petstore_auth | write:pets | read:pets |

### Models
---

### Pet  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | long |  | No |
| category | [Category](#category) |  | No |
| name | string |  | Yes |
| photoUrls | [ string ] |  | Yes |
| tags | [ [Tag](#tag) ] |  | No |
| status | string | pet status in the store | No |

### Order  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | long |  | No |
| petId | long |  | No |
| quantity | integer |  | No |
| shipDate | dateTime |  | No |
| status | string | Order Status | No |
| complete | boolean |  | No |

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

### ApiResponse  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| code | integer |  | No |
| type | string |  | No |
| message | string |  | No |