# astroarc-ephemeris

A pure astronomical calculation service. Given a datetime and geographic coordinates, it returns planetary positions, house cusps, and aspects — nothing more.

This service is the ephemeris backend for [AstroArc](https://astroarc.app), an astrology mobile application. It is hosted as a Railway internal service and is not publicly accessible.

## What this service does

- Accepts a datetime and coordinates (latitude, longitude)
- Returns planetary positions (longitude, latitude, speed, retrograde status)
- Returns house cusps and angles (ASC, MC, etc.)
- Returns aspects between planets

## What this service does NOT do

- No user accounts or authentication
- No database
- No business logic specific to any application
- No AI or LLM calls
- No external API calls

This service knows only about astronomy.

## API

### `GET /health`

Returns `{ status: "ok", timestamp: "<ISO 8601>" }`.

### `POST /natal`

Calculates a natal chart for a given moment and location.

**Request body:**
```json
{
  "datetime": "1990-06-15T14:30:00Z",
  "lat": 56.9496,
  "lon": 24.1052,
  "houseSystem": "placidus"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `datetime` | string | ISO 8601 datetime |
| `lat` | number | Latitude (-90 to 90) |
| `lon` | number | Longitude (-180 to 180) |
| `houseSystem` | string | `"placidus"` or `"whole-sign"` |

**Response:** `{ planets, houses, ascendant, aspects }`

### `POST /transits`

Calculates current planetary positions and their aspects to natal planets.

**Request body:**
```json
{
  "datetime": "2026-03-24T12:00:00Z",
  "lat": 56.9496,
  "lon": 24.1052,
  "natalPlanets": [
    { "planet": "Sun", "longitude": 84.42 },
    { "planet": "Moon", "longitude": 312.15 }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `datetime` | string | ISO 8601 datetime |
| `lat` | number | Latitude (-90 to 90) |
| `lon` | number | Longitude (-180 to 180) |
| `natalPlanets` | array | Each entry has `planet` (string) and `longitude` (number) |

**Response:** `{ planets, aspects }`

## Tech stack

- Node.js + TypeScript
- Express
- [sweph](https://www.npmjs.com/package/sweph) — Swiss Ephemeris Node.js binding

## Development

```bash
npm install
npm run dev       # Start with ts-node
npm run build     # Compile TypeScript
npm start         # Run compiled output
```

## License

AGPL-3.0-only — see `package.json` for the license identifier. A `LICENSE` file has not yet been added to this repository.
