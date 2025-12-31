import express from 'express';
import dotenv from 'dotenv';
import { statsRoute } from './routes/stats';
import { avgRoute } from './routes/avg';
import { lastRoute } from './routes/last';
import { liveRoute } from './routes/live';

const app = express();
dotenv.config();

export interface PlayersResponse {
  player_id: string;
  nickname: string;
  games: {
    cs2?: CS2Stats;
  };
}

export interface CS2Stats {
  faceit_elo: number;
  skill_level: number;
}

app.get('/', (_, res) => {
  res.redirect('https://github.com/mxgic1337/faceit-se-api#readme');
});

app.use('/stats', statsRoute);
app.use('/last', lastRoute);
app.use('/live', liveRoute);
app.use('/avg', avgRoute);

export function handleError(err: Error, res: express.Response) {
  res.send(`Wystąpił błąd. Spróbuj ponownie później.`);
  console.error(err);
}

if (!process.env.API_KEY) {
  console.error('Nie znaleziono API_KEY w pliku .env.');
} else {
  if (!process.env.PORT) {
    console.warn('Nie znaleziono PORT w pliku .env.');
  }
  app.listen(process.env.PORT || 80);
  console.log(`Uruchomiono serwer na porcie ${process.env.PORT || 80}.`);
}
