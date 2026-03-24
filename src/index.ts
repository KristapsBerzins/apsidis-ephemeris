import express, { Request, Response } from 'express';
import path from 'path';
import sweph from 'sweph';
import { validateInput, calculateNatalChart } from './calculations/natal';
import { validateTransitInput, calculateTransits } from './calculations/transits';

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const EPHE_PATH = process.env.EPHE_PATH ?? path.join(__dirname, '..', 'ephemeris');

sweph.set_ephe_path(EPHE_PATH);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/natal', (req: Request, res: Response) => {
  const validation = validateInput(req.body);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }
  try {
    const chart = calculateNatalChart(validation.data);
    res.json(chart);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/natal/test', (_req: Request, res: Response) => {
  try {
    const chart = calculateNatalChart({
      datetime: '1990-06-15T13:30:00Z',
      lat: 51.5,
      lon: -0.1667,
      houseSystem: 'placidus',
    });
    res.json(chart);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/transits', (req: Request, res: Response) => {
  const validation = validateTransitInput(req.body);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }
  try {
    const chart = calculateTransits(validation.data);
    res.json(chart);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/transits/test', (_req: Request, res: Response) => {
  try {
    // First compute the reference natal chart (1990-06-15, London)
    const natal = calculateNatalChart({
      datetime: '1990-06-15T13:30:00Z',
      lat: 51.5,
      lon: -0.1667,
      houseSystem: 'placidus',
    });
    // Use today's date and London coordinates for the transit
    const now = new Date().toISOString();
    const chart = calculateTransits({
      datetime: now,
      lat: 51.5074,
      lon: -0.1278,
      natalPlanets: natal.planets.map((p) => ({
        planet: p.planet,
        longitude: p.longitude,
      })),
    });
    res.json({ transitDatetime: now, natalDatetime: '1990-06-15T13:30:00Z', ...chart });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.listen(PORT, '::', () => {
  console.log(`astroarc-ephemeris listening on [::]:${PORT} (ephe: ${EPHE_PATH})`);
});
