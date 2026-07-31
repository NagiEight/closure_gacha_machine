# Banner & Operator API Documentation

## Base URL
```
http://localhost:3000
```

---

# API Endpoints
These endpoints return informations about Operators and Banners.

## Get Banners (Paginated)
Returns an array of banners for a specific page.

### Request
```http
GET /api/banners/:Page
```

### Parameters
| Parameter | Type | Description |
|------------|--------|-------------|
| Page | number | Page index (must be greater than 0) |

### Example
```http
GET /api/banners/1
```

### Success Response
**Status:** `200 OK`
```typescript
enum BannerTypes {
    Standard,
    Limited,
    Orienteering,
    JointOperation,
    TFTW
}

type GetBannerPageResponse = {
    Name: string;
    Type: BannerTypes,
    ReleaseDate: number;
}[];
```
**Example**
```json
[
    {
        "Name": "EN 600 Meters Over The Facts",
        "Type": 0,
        "ReleaseDate": 1764892800000
    },
    {
        "Name": "EN A Shared Oath of Guardianship",
        "Type": 1,
        "ReleaseDate": 1761955200000
    },
    {
        "Name": "EN A Wanderer in the Wind",
        "Type": 0,
        "ReleaseDate": 1649894400000
    },
    {
        "Name": "EN Abyss Corrosion",
        "Type": 1,
        "ReleaseDate": 1651363200000
    },
    {
        "Name": "EN An Eternity Aflame",
        "Type": 1,
        "ReleaseDate": 1737504000000
    },
    {
        "Name": "EN Anchor In The Deep",
        "Type": 0,
        "ReleaseDate": 1717545600000
    },
    {
        "Name": "EN Anchor In The Deep Rerun",
        "Type": 0,
        "ReleaseDate": 1750291200000
    },
    {
        "Name": "EN And the Canoe'll Carry Us to You",
        "Type": 0,
        "ReleaseDate": 1739491200000
    },
    {
        "Name": "EN Arbiter Aequissimus",
        "Type": 0,
        "ReleaseDate": 1703116800000
    },
    {
        "Name": "EN Arbiter Aequissimus Rerun",
        "Type": 0,
        "ReleaseDate": 1719273600000
    }
]
```

### Error Response
**Status:** `404 Not Found`
```json
{
    "message": "Invalid pagination index."
}
```

---

## Get Banner Details
Returns information about a specific banner.

### Request
```http
GET /api/banner/:BannerName
```

### Parameters
| Parameter | Type | Description |
|------------|--------|-------------|
| BannerName | string | Banner identifier or name |

### Example
```http
GET /api/banner/EN A Shared Oath of Guardianship
```

### Success Response
**Status:** `200 OK`
```typescript
enum BannerTypes {
    Standard,
    Limited,
    Orienteering,
    JointOperation,
    TFTW
} 

interface GetBannerResponse {
    Name: string;
    ReleaseDate: number;
    Type: BannerTypes;
    OperatorPool: {
        SixStarsPool: {
            Primary: string[];
            Secondary: string[];
            Standard: string[];
        };
        FiveStarsPool: {
            Primary: string[];
            Standard: string[];
        };
        FourStarsPool: {
            Primary: string[];
            Standard: string[];
        };
        ThreeStarsPool: string[];
    };
}
```
**Example**
```json
{
    "Name": "EN A Shared Oath of Guardianship",
    "ReleaseDate": 1761955200000,
    "Type": 1,
    "OperatorPool": {
        "SixStarsPool": {
            "Primary": [
                "char_1046_sbell2",
                "char_1045_svash2"
            ],
            "Secondary": [
                "char_1038_whitw2",
                "char_245_cello",
                "char_1035_wisdel"
            ],
            "Standard": ["<6* operators>"]
        },
        "FiveStarsPool": {
            "Primary": [
                "char_4211_snhunt"
            ],
            "Standard": ["<5* operators>"]
        },
        "FourStarsPool": {
            "Primary": [],
            "Standard": ["<4* operators>"]
        },
        "ThreeStarsPool": ["<3* operators>"],
    }
}
```

### Error Response
**Status:** `404 Not Found`
```json
{
    "message": "Banner '${BannerName}' doesn't exist."
}
```

---

## Get Operator Details
Returns information about a specific operator.

### Request
```http
GET /api/operator/:OperatorID
```

### Parameters
| Parameter | Type | Description |
|------------|--------|-------------|
| OperatorID | string | Operator identifier |

### Example
```http
GET /api/operator/char_103_angel
```

### Success Response
**Status:** `200 OK`
```typescript
interface GetOperatorResponse {
    ID: string;
    Name: string;
    Rarity: number;
    ReleaseDate: number;
    Limited: boolean;
}
```
**Example**
```json
{
    "ID": "char_103_angel",
    "Name": "Exusiai",
    "Rarity": 6,
    "ReleaseDate": 1580860800000,
    "Limited": false
}
```

### Error Response
**Status:** `404 Not Found`
```json
{
    "message": "Operator '${OperatorID}' doesn't exist."
}
```

---

# Asset Endpoints
These endpoints return PNG image files.

---

## Get Banner Cover Image
Returns the cover image associated with a banner.

### Request
```http
GET /assets/banner/:BannerName
```

### Parameters
| Parameter | Type | Description |
|------------|--------|-------------|
| BannerName | string | Banner identifier or name |

### Example
```http
GET /assets/banner/EN A Shared Oath of Guardianship
```

### Success Response
**Status:** `200 OK` <br/>
**Content-Type:** `image/png`

### Error Response
**Status:** `404 Not Found`
```json
{
    "message": "Banner '${BannerName}' doesn't exist."
}
```

---

## Get Operator Artwork
Returns the base artwork image for an operator.

### Request
```http
GET /assets/operator/:OperatorID
```

### Parameters
| Parameter | Type | Description |
|------------|--------|-------------|
| OperatorID | string | Operator identifier |

### Example
```http
GET /assets/operator/char_103_angel
```

### Success Response
**Status:** `200 OK` <br/>
**Content-Type:**`image/png`

### Error Response
**Status:** `404 Not Found`
```json
{
    "message": "Operator '${OperatorID}' doesn't exist."
}
```

---

## Get Operator E2 Artwork
Returns the Elite 2 (E2) artwork image for an operator.

### Request
```http
GET /assets/e2operator/:OperatorID
```
### Parameters
| Parameter | Type | Description |
|------------|--------|-------------|
| OperatorID | string | Operator identifier |

### Example
```http
GET /asset/e2operator/char_103_angel
```

### Success Response
**Status:** `200 OK` <br/>
**Content-Type:** `image/png`

### Error Response
**Status:** `404 Not Found`
```json
{
    "message": "Operator '${OperatorID}' doesn't exist."
}
```

---

## Get Operator Card

### Request
```http
GET /assets/card/:OperatorID
```

### Parameters
| Parameter | Type | Description |
|------------|--------|-------------|
| OperatorID | string | Operator identifier |

### Example
```http
GET /assets/operator/char_103_angel
```

### Success Response
**Status:** `200 OK` <br/>
**Content-Type:**`image/png`

### Error Response
**Status:** `404 Not Found`
```json
{
    "message": "Operator '${OperatorID}' doesn't exist."
}
```

---

# Gacha Endpoints
These endpoints are for interacting with the gacha system.

---

## Create session token
Create a new session token, this is necessary for interacting with the /gacha/ endpoints.

### Request
```http
POST /gacha/create
```

### Success Response
**Status:** `200 OK`
```txt
Create profile successfully.
```
**Header:**
```json
{
    "Session-Token": "<your session token>"
}
```

---

## Perform a roll
Perform a gacha roll on a specific banner.

### Request
```http
POST /gacha/:BannerName/roll
```

### Parameters
| Parameter | Type | Description |
|------------|--------|-------------|
| BannerName | string | Banner identifier or name |

### Headers
```json
{
    "Session-Token": "<your session token>"
}
```

### Example
```http
GET /gacha/EN A Shared Oath of Guardianship/roll
```

### Success Response
```typescript
interface GachaRollResponse {
    Result: string;
}
```
**Example:**
```json
{
    "Result": "char_1046_sbell2"
}
```

### Error Response
**Status:** `404 Not Found`
```json
{
    "message": "Missing session token."
}
```
```json
{
    "message": "There are no profile associated with this token."
}
```
```json
{
    "message": "Banner '${BannerName}' doesn't exist."
}
```

---

## Perform multiple rolls
Perform multiple gacha rolls on a specific banner.

### Request
```http
POST /gacha/:BannerName/roll/:Count
```

### Parameters
| Parameter | Type | Description |
|------------|--------|-------------|
| BannerName | string | Banner identifier or name |
| Count | number | Amount of times you want to roll (must be greater than 0) |

### Headers
```json
{
    "Session-Token": "<your session token>"
}
```

### Example
```http
GET /gacha/EN A Shared Oath of Guardianship/roll/10
```

### Success Response
```typescript
interface GachaMultiRollResponse {
    Result: string[];
}
```
**Example:**
```json
{
    "Result": [
        "char_1046_sbell2",
        "<9 more character ids>"
    ]
}
```

### Error Response
**Status:** `404 Not Found`
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
```json
{
    "message": "There are no profile associated with this token."
}
```
```json
{
    "message": "Banner '${BannerName}' doesn't exist."
}
```

---

## Delete a session token
Delete a session token, will invalidate this token. This is irrecoverable.

### Request
```http
PURGE /gacha/delete/
```

### Headers
```json
{
    "Session-Token": "<your session token>"
}
```

### Success Response
**Status:** `200 OK`
```txt
Delete profile successfully.
```

### Error Response
**Status:** `404 Not Found`
```json
{
    "message": "Missing session token."
}
```
```json
{
    "message": "There are no profile associated with this token."
}
```

---

# Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Request completed successfully |
| 404 | Resource not found or invalid parameter |

---

# Notes

- All image endpoints return PNG files.
- Banner pagination starts at page `1`.
- Requests for non-existent banners or operators return a `404` response.
- Responses are served directly from the application's database manager (`Database.Manager`).