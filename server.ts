import express from 'express'
import dotenv from 'dotenv'

const app = express()

dotenv.configDotenv()

interface PlayersResponse {
    player_id: string,
    nickname: string,
    games: {
        cs2?: CS2Stats
    },
}

interface CS2Stats {
    faceit_elo: number,
    skill_level: number,
}

interface HistoryResponse {
    end: number,
    from: number,
    start: number,
    to: number,
    items: Match[]
}

interface Match {
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

const headers = {
    Authorization: `Bearer ${process.env.API_KEY}`
}

app.get('/', (req, res) => {
    res.send(`<h1>Witaj!</h1>Użycie: <code><b>${req.hostname}/stats/[nick]</b></code>, np. <code><b>${req.hostname}/stats/Magic2115</b></code><br/>
    <a href="https://github.com/mxgic1337/faceit-stats-api">GitHub</a>`)
})

app.get('/stats/:playerName', (req, res) => {
    console.log(`%c /stats %c Pobieranie statystyk gracza %c${req.params.playerName}%c...`, 'background: #002fff; color: #fff;', 'color: #fff', 'color: #4a6bff', 'color: #fff;')

    fetch(`https://open.faceit.com/data/v4/players?nickname=${req.params.playerName}&game=cs2`, {
        headers: headers
    }).then(async response => {
        if (response.ok) {
            const playersResponse = (await response.json() as PlayersResponse)

            if (!playersResponse.games.cs2) {
                res.send(`Ten gracz nigdy nie grał w CS2 na FACEIT.`)
                console.log(`%c /stats %c Gracz %c${req.params.playerName}%c nigdy nie grał w CS2 na FACEIT.`, 'background: #002fff; color: #fff;', 'color: #fff', 'color: #4a6bff', 'color: #fff;')
                return
            }else{
                const playerId = playersResponse.player_id
                const playerElo = playersResponse.games.cs2.faceit_elo
                const playerLevel = playersResponse.games.cs2.skill_level

                const startDate = new Date()
                startDate.setHours(0)
                startDate.setMinutes(0)
                startDate.setSeconds(0)

                fetch(`https://open.faceit.com/data/v4/players/${playerId}/history?game=cs2&limit=50`, {headers}).then(async response => {
                    if (response.ok) {
                        const historyResponse = await response.json() as HistoryResponse
                        const matches = historyResponse.items;

                        let wins = 0
                        let losses = 0
                        for (const i in matches) {
                            if (startDate.getTime() / 1000 >= matches[i].started_at) continue

                            const match = matches[i]
                            const winners = match.results.winner
                            let found = false
                            for (const i2 in match.teams[winners].players) {
                                if (match.teams[winners].players[i2].player_id === playerId) {
                                    found = true;
                                }
                            }
                            if (found) {
                                wins++
                            } else {
                                losses++
                            }

                        }
                        res.send(`LVL: ${playerLevel}, ELO: ${playerElo}, Bilans: ${wins}W/${losses}L`)
                        console.log(`%c /stats %c Zwrócono statystyki gracza %c${req.params.playerName}%c.`, 'background: #00ff33; color: #000;', 'color: #fff', 'color: #47ff6c', 'color: #fff;')
                    }else{
                        res.send(`Wystąpił błąd. Spróbuj ponownie później.`)
                        console.log(`%c /stats %c %c ${response.status} %c Wystąpił błąd: %c${await response.text()}`, 'background: #ff1c1c; color: #fff;', 'color: #fff', 'background: #ff1c1c; color: #fff;', 'color: #fff;', 'color: #ff4a4a')
                    }
                })
            }
        } else {
            if (response.status === 404) {
                res.send(`Nie znaleziono gracza ${req.params.playerName} na FACEIT.`)
                console.log(`%c /stats %c %c 404 %c Nie znaleziono gracza %c${req.params.playerName}`, 'background: #ff1c1c; color: #fff;', 'color: #fff', 'background: #ff1c1c; color: #fff;', 'color: #fff;', 'color: #ff4a4a')
            } else {
                res.send(`Wystąpił błąd. Spróbuj ponownie później.`)
                console.log(`%c /stats %c %c ${response.status} %c Wystąpił błąd: %c${await response.text()}`, 'background: #ff1c1c; color: #fff;', 'color: #fff', 'background: #ff1c1c; color: #fff;', 'color: #fff;', 'color: #ff4a4a')
            }
        }
    })
})

if (!process.env.API_KEY) {
    console.log(`%c Serwer %c Nie znaleziono klucza API (%cAPI_KEY%c) w pliku %c.env%c.`, 'background: #ff1c1c; color: #fff;', 'color: #fff;', 'color: #ff4a4a', 'color: #fff;', 'color: #ff4a4a', 'color: #fff;')
}else{
    if (!process.env.PORT) {
        console.log(`%c Serwer %c Nie znaleziono portu (%cPORT%c) w pliku %c.env%c. Używam portu 80.`, 'background: #ff8000; color: #fff;', 'color: #fff;', 'color: #ffa347', 'color: #fff;', 'color: #ffa347', 'color: #fff;')
    }
    app.listen(process.env.PORT || 80)
}