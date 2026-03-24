import express, { Request, Response } from 'express';
import path from 'path';
import sweph from 'sweph';

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const EPHE_PATH = process.env.EPHE_PATH ?? path.join(__dirname, '..', 'ephemeris');

sweph.set_ephe_path(EPHE_PATH);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/natal', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

app.post('/transits', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

app.listen(PORT, '::', () => {
  console.log(`astroarc-ephemeris listening on [::]:${PORT} (ephe: ${EPHE_PATH})`);
});
