import express from 'express'
import {headers, HistoryResponse, PlayersResponse} from "../server";

export const lastRoute = express.Router()

interface MatchStatsResponse {
    rounds: [
        {
            round_stats: {
                Map: string,
                Score: string,
                Winner: string,
            },
            teams: MatchStatsTeam[]
        }
    ]
}

interface MatchStatsTeam {
    team_id: string,
    players: {
        player_id: string
        player_stats: {
            "Kills": string,
            "Assists": string,
            "Deaths": string,
            "K/D Ratio": string,
            "K/R Ratio": string,
            "Headshots %": string,
        }
    }[]
}

lastRoute.get('/:playerName', (req, res) => {
    console.log(`%c /last %c Pobieranie statystyk gracza %c${req.params.playerName}%c...`, 'background: #002fff; color: #fff;', 'color: #fff', 'color: #4a6bff', 'color: #fff;')

    fetch(`https://open.faceit.com/data/v4/players?nickname=${req.params.playerName}&game=cs2`, {
        headers: headers
    }).then(async response => {
        if (response.ok) {
            const playersResponse = (await response.json() as PlayersResponse)

            if (!playersResponse.games.cs2) {
                res.send(`Ten gracz nigdy nie grał w CS2 na FACEIT.`)
                console.log(`%c /last %c Gracz %c${req.params.playerName}%c nigdy nie grał w CS2 na FACEIT.`, 'background: #002fff; color: #fff;', 'color: #fff', 'color: #4a6bff', 'color: #fff;')
                return
            }else{
                const playerId = playersResponse.player_id

                fetch(`https://open.faceit.com/data/v4/players/${playerId}/history?offset=0&limit=1&game=cs2`, {headers}).then(async response => {
                    if (response.ok) {
                        const statsResponse = await response.json() as HistoryResponse
                        const matches = statsResponse.items;

                        if (matches.length === 0) {
                            res.send('Ten gracz nigdy nie rozegrał meczu w CS2.')
                        }else{
                            fetch(`https://open.faceit.com/data/v4/matches/${matches[0].match_id}/stats`, {headers: headers}).then(async response => {
                                if (response.ok) {
                                    const matchStats = await response.json() as MatchStatsResponse

                                    let playersTeam: MatchStatsTeam | undefined = undefined
                                    let enemyTeam: MatchStatsTeam | undefined = undefined

                                    if (matchStats.rounds[0].teams[0].players.filter(player => player.player_id === playerId)[0]) {
                                        playersTeam = matchStats.rounds[0].teams[0]
                                        enemyTeam = matchStats.rounds[0].teams[1]
                                    }else if (matchStats.rounds[0].teams[1].players.filter(player => player.player_id === playerId)[0]) {
                                        playersTeam = matchStats.rounds[0].teams[1]
                                        enemyTeam = matchStats.rounds[0].teams[0]
                                    }

                                    if (!playersTeam || !enemyTeam) {
                                        res.send('Wystąpił błąd. Spróbuj ponownie później.')
                                        return
                                    }

                                    const player = playersTeam.players.filter(player => player.player_id === playerId)[0]

                                    let format = req.query.format as string | undefined || `Mapa: $map, Wynik: $score ($result), Zabójstwa: $kills ($hspercent% HS), Śmierci: $deaths, K/D: $kd`
                                    format = format
                                        .replace('$result',
                                            matchStats.rounds[0].round_stats.Winner === playersTeam.team_id ? "Win" : "Lose")
                                        .replace('$map', matchStats.rounds[0].round_stats.Map)
                                        .replace('$score', matchStats.rounds[0].round_stats.Score)
                                        .replace('$kills', String(player.player_stats.Kills))
                                        .replace('$assists', String(player.player_stats.Assists))
                                        .replace('$deaths', String(player.player_stats.Deaths))
                                        .replace('$kd', String(player.player_stats["K/D Ratio"]))
                                        .replace('$kr', String(player.player_stats["K/R Ratio"]))
                                        .replace('$hspercent', String(player.player_stats["Headshots %"]))
                                    res.send(format)
                                    console.log(`%c /last %c Zwrócono statystyki gracza %c${req.params.playerName}%c.`, 'background: #00ff33; color: #000;', 'color: #fff', 'color: #47ff6c', 'color: #fff;')
                                }else{
                                    res.send(`Wystąpił błąd. Spróbuj ponownie później.`)
                                    console.log(`%c /last %c %c ${response.status} %c Wystąpił błąd: %c${await response.text()}`, 'background: #ff1c1c; color: #fff;', 'color: #fff', 'background: #ff1c1c; color: #fff;', 'color: #fff;', 'color: #ff4a4a')
                                }
                            }).catch(err => {
                                res.send(`Wystąpił błąd. Spróbuj ponownie później.`)
                                console.log(`%c /last %c %c ${response.status} %c Wystąpił błąd: %c${err}`, 'background: #ff1c1c; color: #fff;', 'color: #fff', 'background: #ff1c1c; color: #fff;', 'color: #fff;', 'color: #ff4a4a')
                            })


                        }


                    }else{
                        res.send(`Wystąpił błąd. Spróbuj ponownie później.`)
                        console.log(`%c /last %c %c ${response.status} %c Wystąpił błąd: %c${await response.text()}`, 'background: #ff1c1c; color: #fff;', 'color: #fff', 'background: #ff1c1c; color: #fff;', 'color: #fff;', 'color: #ff4a4a')
                    }
                })
            }
        } else {
            if (response.status === 404) {
                res.send(`Nie znaleziono gracza ${req.params.playerName} na FACEIT.`)
                console.log(`%c /last %c %c 404 %c Nie znaleziono gracza %c${req.params.playerName}`, 'background: #ff1c1c; color: #fff;', 'color: #fff', 'background: #ff1c1c; color: #fff;', 'color: #fff;', 'color: #ff4a4a')
            } else {
                res.send(`Wystąpił błąd. Spróbuj ponownie później.`)
                console.log(`%c /last %c %c ${response.status} %c Wystąpił błąd: %c${await response.text()}`, 'background: #ff1c1c; color: #fff;', 'color: #fff', 'background: #ff1c1c; color: #fff;', 'color: #fff;', 'color: #ff4a4a')
            }
        }
    })
})