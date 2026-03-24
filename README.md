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

**Request body** (planned):
```json
{
  "datetime": "1990-06-15T14:30:00Z",
  "latitude": 56.9496,
  "longitude": 24.1052,
  "houseSystem": "P"
}
```

### `POST /transits`

Calculates planetary positions for a given moment.

**Request body** (planned):
```json
{
  "datetime": "2026-03-24T12:00:00Z",
  "latitude": 56.9496,
  "longitude": 24.1052
}
```

## Tech stack

- Node.js + TypeScript
- Express
- [swisseph](https://www.npmjs.com/package/swisseph) — Swiss Ephemeris Node.js binding

## Development

```bash
npm install
npm run dev       # Start with ts-node
npm run build     # Compile TypeScript
npm start         # Run compiled output
```

## License

Copyright (C) 2026 AstroArc contributors

This program is free software: you can redistribute it and/or modify it under the terms of the **GNU Affero General Public License** as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
