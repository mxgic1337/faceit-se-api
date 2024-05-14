import express from 'express'
import dotenv from 'dotenv'
import {statsRoute} from "./routes/stats";
import {avgRoute} from "./routes/avg";
import {lastRoute} from "./routes/last";

const app = express()

dotenv.configDotenv()

export interface HistoryResponse {
    end: number,
    from: number,
    start: number,
    to: number,
    items: Match[]
}

export interface Match {
    competition_id: string;
    competition_name: string;
    competition_type: string;
    faceit_url: string;
    finished_at: number;
    game_id: string;
    game_mode: string;
    match_id: string;
    match_type: string;
    max_players: number;
    organizer_id: string;
    playing_players: string[];
    region: string;
    results: {
        score: {
            [key: string]: number;
        };
        winner: string;
    };
    started_at: number;
    status: string;
    teams: {
        [key: string]: {
            avatar: string;
            nickname: string;
            players: {
                avatar: string;
                faceit_url: string;
                game_player_id: string;
                game_player_name: string;
                nickname: string;
                player_id: string;
                skill_level: number;
            }[];
            team_id: string;
            type: string;
        };
    };
    teams_size: number;
}

export interface PlayersResponse {
    player_id: string,
    nickname: string,
    games: {
        cs2?: CS2Stats
    },
}

export interface CS2Stats {
    faceit_elo: number,
    skill_level: number,
}

export const headers = {
    Authorization: `Bearer ${process.env.API_KEY}`
}

app.get('/', (req, res) => {
    res.send(`
    <h1>Witaj!</h1>
    Użycie: <code><b>/stats/[nick]</b></code>, np. <code><b>/stats/donk666</b></code><br/>
    Możesz również zmienić format zwracanej wiadomości, dodając parametr <b>?format</b>.<br/>
    Przykładowo: <code><b>/stats/donk666?format=LVL: $lvl, ELO: $elo, W: $wins, L: $losses</b></code> zwróci <code><b>LVL: 10, ELO: 4401, W: 0, L: 0</b></code><br/>
    <br/>
    <h2>Dostępne zmienne:</h2>
    <ul>
        <li><b>$lvl</b> - Poziom gracza</li>
        <li><b>$elo</b> - Punkty ELO gracza</li>
        <li><b>$diff</b> - Różnica (bilans) ELO (ostatnie 24h, do 100 gier)</li>
        <li><b>$wins</b> - Zwycięstwa gracza (ostatnie 24h, do 100 gier)</li>
        <li><b>$losses</b> - Przegrane gracza (ostatnie 24h, do 100 gier)</li>
    </ul>
    <a href="https://github.com/mxgic1337/faceit-se-api">GitHub</a> &bull; <a href="https://docs.mxgic1337.xyz/faceit-se-api/#/">Dokumentacja</a>
    <p>Projekt nie jest powiązany z <b>FACEIT</b> lub/i <b>StreamElements</b>.</p>`)
})

app.use('/stats', statsRoute)
app.use('/last', lastRoute)
app.use('/avg', avgRoute)

if (!process.env.API_KEY) {
    console.log(`%c Serwer %c Nie znaleziono klucza API (%cAPI_KEY%c) w pliku %c.env%c.`, 'background: #ff1c1c; color: #fff;', 'color: #fff;', 'color: #ff4a4a', 'color: #fff;', 'color: #ff4a4a', 'color: #fff;')
} else {
    if (!process.env.PORT) {
        console.log(`%c Serwer %c Nie znaleziono portu (%cPORT%c) w pliku %c.env%c. Używam portu 80.`, 'background: #ff8000; color: #fff;', 'color: #fff;', 'color: #ffa347', 'color: #fff;', 'color: #ffa347', 'color: #fff;')
    }
    app.listen(process.env.PORT || 80)
}