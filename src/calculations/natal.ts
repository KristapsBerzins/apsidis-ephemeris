import sweph from 'sweph';

const { constants: C } = sweph;

// ---------- types ----------

interface NatalInput {
  datetime: string;
  lat: number;
  lon: number;
  houseSystem: 'placidus' | 'whole-sign';
}

interface PlanetResult {
  planet: string;
  longitude: number;
  sign: string;
  signDegree: number;
  house: number;
  retrograde: boolean;
}

interface HouseResult {
  house: number;
  longitude: number;
  sign: string;
  signDegree: number;
}

interface PointResult {
  longitude: number;
  sign: string;
  signDegree: number;
}

interface AspectResult {
  planet1: string;
  planet2: string;
  type: string;
  orb: number;
}

export interface NatalChart {
  planets: PlanetResult[];
  houses: HouseResult[];
  ascendant: PointResult;
  aspects: AspectResult[];
}

// ---------- constants ----------

export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

export const PLANETS: [string, number][] = [
  ['Sun',       C.SE_SUN],
  ['Moon',      C.SE_MOON],
  ['Mercury',   C.SE_MERCURY],
  ['Venus',     C.SE_VENUS],
  ['Mars',      C.SE_MARS],
  ['Jupiter',   C.SE_JUPITER],
  ['Saturn',    C.SE_SATURN],
  ['Uranus',    C.SE_URANUS],
  ['Neptune',   C.SE_NEPTUNE],
  ['Pluto',     C.SE_PLUTO],
  ['NorthNode', C.SE_TRUE_NODE],
  ['Chiron',    C.SE_CHIRON],
];

export const ASPECTS: [string, number, number][] = [
  ['conjunction', 0,   8],
  ['sextile',     60,  4],
  ['square',      90,  6],
  ['trine',       120, 6],
  ['opposition',  180, 8],
];

export const CALC_FLAG = C.SEFLG_SWIEPH | C.SEFLG_SPEED;

// ---------- helpers ----------

export function signFromLongitude(lng: number): { sign: string; signDegree: number } {
  const idx = Math.floor(lng / 30) % 12;
  return { sign: SIGNS[idx], signDegree: round(lng % 30) };
}

export function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function isoToJulDay(iso: string): number {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const hour = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
  return sweph.julday(y, m, day, hour, C.SE_GREG_CAL);
}

/** Determine which house (1-12) a given ecliptic longitude falls in. */
function houseForLongitude(lng: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    if (start < end) {
      if (lng >= start && lng < end) return i + 1;
    } else {
      // wraps around 360/0
      if (lng >= start || lng < end) return i + 1;
    }
  }
  return 1; // fallback
}

// ---------- validation ----------

export function validateInput(body: unknown): { valid: true; data: NatalInput } | { valid: false; error: string } {
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

  const validSystems = ['placidus', 'whole-sign'];
  if (!validSystems.includes(b.houseSystem as string)) {
    return { valid: false, error: `"houseSystem" must be one of: ${validSystems.join(', ')}` };
  }

  return {
    valid: true,
    data: {
      datetime: b.datetime,
      lat: b.lat,
      lon: b.lon,
      houseSystem: b.houseSystem as NatalInput['houseSystem'],
    },
  };
}

// ---------- main calculation ----------

export function calculateNatalChart(input: NatalInput): NatalChart {
  const jd = isoToJulDay(input.datetime);

  // --- Houses ---
  // Always compute Placidus first (we need ASC for whole-sign)
  const houseResult = sweph.houses(jd, input.lat, input.lon, 'P');
  const ascLng = houseResult.data.points[0]; // ASC longitude

  let cusps: number[];
  if (input.houseSystem === 'whole-sign') {
    // Whole Sign: house 1 starts at 0° of the ASC's sign
    const ascSignStart = Math.floor(ascLng / 30) * 30;
    cusps = Array.from({ length: 12 }, (_, i) => (ascSignStart + i * 30) % 360);
  } else {
    cusps = [...houseResult.data.houses];
  }

  const houses: HouseResult[] = cusps.map((lng, i) => ({
    house: i + 1,
    longitude: round(lng),
    ...signFromLongitude(lng),
  }));

  const ascendant: PointResult = {
    longitude: round(ascLng),
    ...signFromLongitude(ascLng),
  };

  // --- Planets ---
  const planets: PlanetResult[] = PLANETS.map(([name, id]) => {
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
      house: houseForLongitude(lng, cusps),
      retrograde: speed < 0,
    };
  });

  // --- Aspects ---
  const aspects: AspectResult[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      let diff = Math.abs(planets[i].longitude - planets[j].longitude);
      if (diff > 180) diff = 360 - diff;

      for (const [type, angle, maxOrb] of ASPECTS) {
        const orb = Math.abs(diff - angle);
        if (orb <= maxOrb) {
          aspects.push({
            planet1: planets[i].planet,
            planet2: planets[j].planet,
            type,
            orb: round(orb),
          });
          break; // one aspect per pair
        }
      }
    }
  }

  return { planets, houses, ascendant, aspects };
}
