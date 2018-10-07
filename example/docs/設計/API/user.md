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

### /user
---
##### ***POST***
**Summary:** Create user

**Description:** This can only be done by the logged in user.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| body | body | Created user object | Yes | [User](#user) |

**Responses**

| Code | Description |
| ---- | ----------- |
| default | successful operation |

### /user/createWithArray
---
##### ***POST***
**Summary:** Creates list of users with given input array

**Description:** 

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| body | body | List of user object | Yes | [ [User](#user) ] |

**Responses**

| Code | Description |
| ---- | ----------- |
| default | successful operation |

### /user/createWithList
---
##### ***POST***
**Summary:** Creates list of users with given input array

**Description:** 

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| body | body | List of user object | Yes | [ [User](#user) ] |

**Responses**

| Code | Description |
| ---- | ----------- |
| default | successful operation |

### /user/login
---
##### ***GET***
**Summary:** Logs user into the system

**Description:** 

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| username | query | The user name for login | Yes | string |
| password | query | The password for login in clear text | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | successful operation | string |
| 400 | Invalid username/password supplied |  |

### /user/logout
---
##### ***GET***
**Summary:** Logs out current logged in user session

**Description:** 

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |

**Responses**

| Code | Description |
| ---- | ----------- |
| default | successful operation |

### /user/{username}
---
##### ***GET***
**Summary:** Get user by user name

**Description:** 

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| username | path | The name that needs to be fetched. Use user1 for testing.  | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | successful operation | [User](#user) |
| 400 | Invalid username supplied |  |
| 404 | User not found |  |

##### ***PUT***
**Summary:** Updated user

**Description:** This can only be done by the logged in user.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| username | path | name that need to be updated | Yes | string |
| body | body | Updated user object | Yes | [User](#user) |

**Responses**

| Code | Description |
| ---- | ----------- |
| 400 | Invalid user supplied |
| 404 | User not found |

##### ***DELETE***
**Summary:** Delete user

**Description:** This can only be done by the logged in user.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| username | path | The name that needs to be deleted | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 400 | Invalid username supplied |
| 404 | User not found |

### Models
---

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