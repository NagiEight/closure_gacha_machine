# Banner & Operator API Documentation

## Base URL
```
http://localhost:3000
```

---

# API Endpoints

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
type GetBannerPageResponse = string[];
```
**Example**
```json
[
    "EN Cremation Last Wish",
    "EN Earthborn Metals",
    "EN Illusions of the Past",
    "EN Quicksand Vortex",
    "EN Behold the Sword of Tide Rerun",
    "EN Misty Wild",
    "EN Lisa of the Valley",
    "EN First Snowfall",
    "EN The Piper on the Knoll",
    "EN Thousand Headed Arsenal"
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
interface GetBannerResponse {
    Name: string;
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
    "OperatorPool": {
        "SixStarsPool": {
            "Primary": [
                "char_1046_sbell2"
            ],
            "Secondary": [
                "char_1038_whitw2",
                "char_1045_svash2",
                "char_245_cello",
                "char_1035_wisdel"
            ],
            "Standard": []
        },
        "FiveStarsPool": {
            "Primary": [
                "char_4211_snhunt"
            ],
            "Standard": []
        },
        "FourStarsPool": {
            "Primary": [],
            "Standard": []
        },
        "ThreeStarsPool": []
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
}
```
**Example**
```json
{
    "ID": "char_103_angel",
    "Name": "Exusiai",
    "Rarity": 6
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
**Status:** `200 OK`
**Content-Type:**
```text
image/png
```
### Error Response
**Status:** `404 Not Found`
```json
{
    "message": "Operator '${OperatorID}' doesn't exist."
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