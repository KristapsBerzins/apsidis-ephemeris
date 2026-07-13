import sweph from 'sweph';
import {
  PLANETS, ASPECTS, CALC_FLAG,
  signFromLongitude, round, isoToJulDay,
} from './natal';

// ---------- types ----------

interface NatalPlanetInput {
  planet: string;
  longitude: number;
}

interface TransitInput {
  datetime: string;
  lat: number;
  lon: number;
  natalPlanets: NatalPlanetInput[];
}

interface TransitPlanet {
  planet: string;
  longitude: number;
  sign: string;
  signDegree: number;
  retrograde: boolean;
}

interface TransitAspect {
  planet1: string;
  planet2: string;
  type: string;
  orb: number;
  natalPlanet: boolean;
}

export interface TransitChart {
  planets: TransitPlanet[];
  aspects: TransitAspect[];
}

// ---------- validation ----------

export function validateTransitInput(
  body: unknown,
): { valid: true; data: TransitInput } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }
  const b = body as Record<string, unknown>;

  if (typeof b.datetime !== 'string') {
    return { valid: false, error: '"datetime" is required and must be an ISO 8601 string' };
  }
  const d = new Date(b.datetime);
  if (isNaN(d.getTime())) {
    return { valid: false, error: '"datetime" is not a valid ISO 8601 date' };
  }

  if (typeof b.lat !== 'number' || b.lat < -90 || b.lat > 90) {
    return { valid: false, error: '"lat" must be a number between -90 and 90' };
  }
  if (typeof b.lon !== 'number' || b.lon < -180 || b.lon > 180) {
    return { valid: false, error: '"lon" must be a number between -180 and 180' };
  }

  // An empty array is valid: the response then contains transit planets only
  // (current sky positions) with no transit-to-natal aspects.
  if (!Array.isArray(b.natalPlanets)) {
    return { valid: false, error: '"natalPlanets" must be an array' };
  }
  for (const p of b.natalPlanets as unknown[]) {
    if (!p || typeof p !== 'object') {
      return { valid: false, error: 'Each entry in "natalPlanets" must be an object with "planet" and "longitude"' };
    }
    const entry = p as Record<string, unknown>;
    if (typeof entry.planet !== 'string' || typeof entry.longitude !== 'number') {
      return { valid: false, error: 'Each entry in "natalPlanets" must have a string "planet" and numeric "longitude"' };
    }
  }

  return {
    valid: true,
    data: {
      datetime: b.datetime,
      lat: b.lat,
      lon: b.lon,
      natalPlanets: (b.natalPlanets as NatalPlanetInput[]).map((p) => ({
        planet: p.planet,
        longitude: p.longitude,
      })),
    },
  };
}

// ---------- main calculation ----------

export function calculateTransits(input: TransitInput): TransitChart {
  const jd = isoToJulDay(input.datetime);

  // --- Transit planets ---
  const planets: TransitPlanet[] = PLANETS.map(([name, id]) => {
    const result = sweph.calc_ut(jd, id, CALC_FLAG);
    if (result.flag < 0) {
      throw new Error(`sweph.calc_ut failed for ${name}: ${result.error}`);
    }
    const lng = result.data[0];
    const speed = result.data[3];
    return {
      planet: name,
      longitude: round(lng),
      ...signFromLongitude(lng),
      retrograde: speed < 0,
    };
  });

  // --- Transit-to-natal aspects only ---
  const aspects: TransitAspect[] = [];
  for (const transit of planets) {
    for (const natal of input.natalPlanets) {
      let diff = Math.abs(transit.longitude - natal.longitude);
      if (diff > 180) diff = 360 - diff;

      for (const [type, angle, maxOrb] of ASPECTS) {
        const orb = Math.abs(diff - angle);
        if (orb <= maxOrb) {
          aspects.push({
            planet1: transit.planet,
            planet2: natal.planet,
            type,
            orb: round(orb),
            natalPlanet: true,
          });
          break; // one aspect per pair
        }
      }
    }
  }

  return { planets, aspects };
}
