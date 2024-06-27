import express from 'express'
import dotenv from 'dotenv'
import {statsRoute} from "./routes/stats";
import {avgRoute} from "./routes/avg";
import {lastRoute} from "./routes/last";
import packageJSON from "./package.json"

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
    <a href="https://github.com/mxgic1337/faceit-se-api">GitHub</a> &bull; <a href="https://docs.mxgic1337.xyz/faceit-se-api/#/">Dokumentacja</a>
    <p>Projekt nie jest powiązany z <b>FACEIT</b> lub/i <b>StreamElements</b>.</p>
    <p>Wersja <b>${packageJSON.version}</b></p>`)
})

app.use('/stats', statsRoute)
app.use('/last', lastRoute)
app.use('/avg', avgRoute)

export function handleError(err: Error, res: express.Response) {
    res.send(`Wystąpił błąd. Spróbuj ponownie później.`)
    console.error(err)
}

if (!process.env.API_KEY) {
    console.log(`%c Serwer %c Nie znaleziono klucza API (%cAPI_KEY%c) w pliku %c.env%c.`, 'background: #ff1c1c; color: #fff;', 'color: #fff;', 'color: #ff4a4a', 'color: #fff;', 'color: #ff4a4a', 'color: #fff;')
} else {
    if (!process.env.PORT) {
        console.log(`%c Serwer %c Nie znaleziono portu (%cPORT%c) w pliku %c.env%c. Używam portu 80.`, 'background: #ff8000; color: #fff;', 'color: #fff;', 'color: #ffa347', 'color: #fff;', 'color: #ffa347', 'color: #fff;')
    }
    app.listen(process.env.PORT || 80)
}