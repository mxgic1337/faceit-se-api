import express from 'express'
import dotenv from 'dotenv'
import {statsRoute} from "./routes/stats";
import {avgRoute} from "./routes/avg";
import {lastRoute} from "./routes/last";
import packageJSON from "./package.json"
import {liveRoute} from "./routes/live";

const app = express()

dotenv.configDotenv()

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

export const HEADERS = {
    "User-Agent": `mxgic1337/faceit-se-api/${packageJSON.version} (mxgic1337.xyz)`,
    "Authorization": `Bearer ${process.env.API_KEY}`
}

export const HEADERS_NO_AUTHORIZATION = {
    "User-Agent": `mxgic1337/faceit-se-api/${packageJSON.version} (mxgic1337.xyz)`,
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
    <a href="https://github.com/mxgic1337/faceit-se-api">GitHub</a>
    <p>Projekt nie jest powiązany z <b>FACEIT</b> lub/i <b>StreamElements</b>.</p>
    <p>Wersja <b>${packageJSON.version}</b></p>`)
})

app.use('/stats', statsRoute)
app.use('/last', lastRoute)
app.use('/live', liveRoute)
app.use('/avg', avgRoute)

export function handleError(err: Error, res: express.Response) {
    res.send(`Wystąpił błąd. Spróbuj ponownie później.`)
    console.error(err)
}

export function clog(source: string, type: 'info' | 'warn' | 'error', message: string) {
    console.log(`[${source}] [${type.toUpperCase()}] ${message}`)
}

if (!process.env.API_KEY) {
    clog('Serwer', 'error', `Nie znaleziono API_KEY w pliku .env.`)
} else {
    if (!process.env.PORT) {
        clog('Serwer', 'warn', `Nie znaleziono PORT w pliku .env.`)
    }
    app.listen(process.env.PORT || 80)
    clog('Serwer', 'info', `Uruchomiono serwer na porcie ${process.env.PORT || 80}.`)
}