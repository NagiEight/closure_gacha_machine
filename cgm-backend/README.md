# Closure Gacha Machine API

## Base URL

```text
http://localhost:3000
```

## Common conventions

- Banner pagination is 1-based.
- All `/gacha/*` routes require the `Session-Token` header.
- Asset routes return a URL string in plain text.
- The server responds with JSON for most data endpoints and text for success messages.
- API rate limit is 50 requests/second by default.

---

# Banner and Operator API

## Get all banner names

Returns every banner name currently stored in the database.

### Request

```http
GET /api/banners/all
```

### Success response

Status: `200 OK`

```json
[
  "EN 600 Meters Over The Facts",
  "EN A Shared Oath of Guardianship",
  "EN A Wanderer in the Wind"
]
```

---

## Get paginated banner list

Returns a page of banner summaries.

### Request

```http
GET /api/banners/:Page
```

### Path parameters

| Name | Type | Required | Description |
|---|---|---:|---|
| Page | number | Yes | 1-based page number. Must be greater than 0. |

### Example

```http
GET /api/banners/1
```

### Success response

Status: `200 OK`

```json
[
  {
    "Name": "EN 600 Meters Over The Facts",
    "Type": "Standard",
    "ReleaseDate": 1764892800000
  },
  {
    "Name": "EN A Shared Oath of Guardianship",
    "Type": "Limited",
    "ReleaseDate": 1761955200000
  }
]
```

### Error response

Status: `400 Bad Request`

```json
{
  "message": "Invalid pagination index."
}
```

---

## Search banners

Searches banners using a JSON body. The request body is optional but required to perform a search; if empty, the server responds with `400`.

### Request

```http
GET /api/banners/search?page=1
```

### Query parameters

| Name | Type | Required | Description |
|---|---|---:|---|
| page | number | Yes | 1-based page number. |

### JSON body

```ts
enum BannerTypes {
  Standard = "Standard",
  Limited = "Limited",
  Crossover = "Crossover",
  Orienteering = "Orienteering",
  JointOperation = "JointOperation",
  TFTW = "TFTW"
}

type SearchQuery = Partial<{
  NameQuery: string;
  BannerType: BannerTypes;
  Includes: string[];
  From: number;
  To: number;
}>;
```

### Example

```http
GET /api/banners/search?page=1
```

```json
{
  "NameQuery": "shared oath",
  "BannerType": "Limited",
  "Includes": ["char_1046_sbell2"],
  "From": 1,
  "To": 9999999999999
}
```

### Success response

Status: `200 OK`

```json
[
  {
    "Name": "EN A Shared Oath of Guardianship",
    "Type": "Limited",
    "ReleaseDate": 1761955200000
  }
]
```

### Error responses

Status: `400 Bad Request`

```json
{
  "message": "Invalid pagination index."
}
```

```json
{
  "message": "Missing request body."
}
```

Status: `404 Not Found`

```json
{
  "message": [
    {
      "code": "invalid_type",
      "path": ["BannerType"],
      "message": "Invalid input"
    }
  ]
}
```

---

## Get banner details

Returns the full banner definition including operator pools.

### Request

```http
GET /api/banner/:BannerName
```

### Path parameters

| Name | Type | Required | Description |
|---|---|---:|---|
| BannerName | string | Yes | Banner name as stored in the data set. |

### Example

```http
GET /api/banner/EN A Shared Oath of Guardianship
```

### Success response

Status: `200 OK`

```json
{
  "Name": "EN A Shared Oath of Guardianship",
  "OperatorPool": {
    "ReleaseDate": 1761955200000,
    "Type": "Limited",
    "SixStarsPool": {
      "Primary": ["char_1046_sbell2", "char_1045_svash2"],
      "Secondary": ["char_1038_whitw2", "char_245_cello"],
      "Standard": ["<6* operators>"]
    },
    "FiveStarsPool": {
      "Primary": ["char_4211_snhunt"],
      "Standard": ["<5* operators>"]
    },
    "FourStarsPool": {
      "Primary": [],
      "Standard": ["<4* operators>"]
    },
    "ThreeStarsPool": ["<3* operators>"]
  }
}
```

### Error response

Status: `404 Not Found`

```json
{
  "message": "Banner 'EN A Shared Oath of Guardianship' doesn't exist."
}
```

---

## Get operator details

Returns the metadata for a single operator.

### Request

```http
GET /api/operator/:OperatorID
```

### Path parameters

| Name | Type | Required | Description |
|---|---|---:|---|
| OperatorID | string | Yes | Exact operator ID, for example `char_103_angel`. |

### Example

```http
GET /api/operator/char_103_angel
```

### Success response

Status: `200 OK`

```json
{
  "ID": "char_103_angel",
  "Name": "Exusiai",
  "Rarity": 6,
  "ReleaseDate": 1580860800000,
  "Limited": false
}
```

### Error response

Status: `404 Not Found`

```json
{
  "message": "Operator 'char_103_angel' doesn't exist."
}
```

---

# Asset endpoints

These endpoints return URLs to PNG images as plain text.

## Banner cover

### Request

```http
GET /assets/banner/:BannerName
```

### Example

```http
GET /assets/banner/EN A Shared Oath of Guardianship
```

### Success response

Status: `200 OK`

```text
https://example.com/assets/banner/EN%20A%20Shared%20Oath%20of%20Guardianship.png
```

### Error response

Status: `404 Not Found`

```json
{
  "message": "Banner 'EN A Shared Oath of Guardianship' doesn't exist."
}
```

---

## Operator artwork

### Request

```http
GET /assets/operator/:OperatorID
```

### Example

```http
GET /assets/operator/char_103_angel
```

### Success response

Status: `200 OK`

```text
https://example.com/assets/operators/char_103_angel.png
```

### Error response

Status: `404 Not Found`

```json
{
  "message": "Operator 'char_103_angel' doesn't exist."
}
```

---

## Elite 2 operator artwork

### Request

```http
GET /assets/e2operator/:OperatorID
```

### Example

```http
GET /assets/e2operator/char_103_angel
```

### Success response

Status: `200 OK`

```text
https://example.com/assets/operators/e2/char_103_angel.png
```

### Error response

Status: `404 Not Found`

```json
{
  "message": "Operator 'char_103_angel' doesn't exist."
}
```

---

## Operator card

### Request

```http
GET /assets/card/:OperatorID
```

### Example

```http
GET /assets/card/char_103_angel
```

### Success response

Status: `200 OK`

```text
https://example.com/assets/cards/char_103_angel.png
```

### Error response

Status: `404 Not Found`

```json
{
  "message": "Operator 'char_103_angel' doesn't exist."
}
```

---

# Gacha API

These endpoints create and manage session-based gacha profiles.

## Create a gacha session

Creates a new profile and returns a `Session-Token` in the response header.

### Request

```http
POST /gacha/create
```

### Success response

Status: `200 OK`

```text
Create profile successfully.
```

Headers:

```http
Session-Token: <your session token>
```

---

## Get profile

Returns the current gacha progress for the authenticated session.

### Request

```http
GET /gacha/profile
```

### Headers

```http
Session-Token: <your session token>
```

### Success response

Status: `200 OK`

```json
{
  "EN A Shared Oath of Guardianship": {
    "Count": 0,
    "RollsWithoutSixStar": 0,
    "RollsSinceLast6StarsRateUp": 0,
    "RollsSinceLast5StarsRateUp": 0,
    "RollsSinceLast4StarsRateUp": 0,
    "Focused": false,
    "TenRolls": false,
    "Storage": {
      "SixStars": {
        "char_1046_sbell2": 0
      },
      "FiveStars": {},
      "FourStars": {},
      "ThreeStars": {}
    }
  }
}
```

### Error responses

Status: `400 Bad Request`

```json
{
  "message": "Missing session token."
}
```

Status: `404 Not Found`

```json
{
  "message": "There are no profile associated with this token."
}
```

---

## Roll once

Performs a single gacha pull on the selected banner.

### Request

```http
POST /gacha/:BannerName/roll
```

### Path parameters

| Name | Type | Required | Description |
|---|---|---:|---|
| BannerName | string | Yes | Banner name exactly as stored in the database. |

### Headers

```http
Session-Token: <your session token>
```

### Request body for Orienteering banners

```json
{
  "SixStarsSelection": ["op_1", "op_2", "op_3"],
  "FiveStarsSelection": ["op_4", "op_5", "op_6"]
}
```

### Success response

Status: `200 OK`

```json
{
  "Result": "char_1046_sbell2"
}
```

### Error responses

Status: `400 Bad Request`

```json
{
  "message": "Missing session token."
}
```

Status: `404 Not Found`

```json
{
  "message": "There are no profile associated with this token."
}
```

```json
{
  "message": "Banner 'EN A Shared Oath of Guardianship' doesn't exist."
}
```

---

## Roll multiple times

Performs multiple rolls in one request.

### Request

```http
POST /gacha/:BannerName/roll/:Count
```

### Path parameters

| Name | Type | Required | Description |
|---|---|---:|---|
| BannerName | string | Yes | Name of the banner to roll on. |
| Count | number | Yes | Number of rolls. Must be greater than 0. |

### Query parameters

| Name | Type | Required | Description |
|---|---|---:|---|
| reduced | boolean | No | If `true` or `1`, returns a counted result instead of a flat array. |

### Headers

```http
Session-Token: <your session token>
```

### Request body for Orienteering banners

```json
{
  "SixStarsSelection": ["op_1", "op_2", "op_3"],
  "FiveStarsSelection": ["op_4", "op_5", "op_6"]
}
```

### Success responses

#### Standard result

Status: `200 OK`

```json
{
  "Result": [
    "char_1046_sbell2",
    "char_103_angel"
  ]
}
```

#### Reduced result

Status: `200 OK`

```json
{
  "Result": {
    "char_1046_sbell2": 1,
    "char_103_angel": 1
  }
}
```

### Error responses

Status: `400 Bad Request`

```json
{
  "message": "Roll count must be a number greater than 0."
}
```

```json
{
  "message": "Missing session token."
}
```

Status: `404 Not Found`

```json
{
  "message": "There are no profile associated with this token."
}
```

```json
{
  "message": "Banner 'EN A Shared Oath of Guardianship' doesn't exist."
}
```

---

## Reset banner progress

Resets the profile progress for a specific banner.

### Request

```http
PATCH /gacha/reset/:BannerName
```

### Headers

```http
Session-Token: <your session token>
```

### Success response

Status: `200 OK`

```text
Progress on EN A Shared Oath of Guardianship has been reset successfully.
```

### Error responses

Status: `400 Bad Request`

```json
{
  "message": "Missing session token."
}
```

Status: `404 Not Found`

```json
{
  "message": "There are no profile associated with this token."
}
```

```json
{
  "message": "Banner 'EN A Shared Oath of Guardianship' doesn't exist."
}
```

---

## Delete gacha session

Deletes the current profile and invalidates the `Session-Token`.

### Request

```http
PURGE /gacha/delete
```

### Headers

```http
Session-Token: <your session token>
```

### Success response

Status: `200 OK`

```text
Delete profile successfully.
```

### Error responses

Status: `400 Bad Request`

```json
{
  "message": "Missing session token."
}
```

Status: `404 Not Found`

```json
{
  "message": "There are no profile associated with this token."
}
```

---

# Status codes

| Code | Meaning |
|---|---|
| 200 | Request succeeded |
| 400 | Missing session token or malformed request |
| 404 | Profile, banner, or operator not found |
| 429 | Rate limit exceeded |

---

# Notes

- Banner names and operator IDs must match the stored database keys exactly.
- The `Session-Token` header is required for all gacha routes.
- Asset routes return URLs to PNG files, not binary data.
- The default rate limit is `50 requests/second` and can be configured in the environment.
