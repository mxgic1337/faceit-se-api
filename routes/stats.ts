import express from 'express'
import {headers, HistoryResponse, PlayersResponse} from "../server";

export const statsRoute = express.Router()

statsRoute.get('/:playerName', (req, res) => {
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
                        let format = req.query.format as string | undefined || `LVL: $lvl, ELO: $elo, Bilans: $winsW / $lossesL`
                        format = format
                            .replace('$lvl', String(playerLevel))
                            .replace('$elo', String(playerElo))
                            .replace('$wins', String(wins))
                            .replace('$losses', String(losses))
                        res.send(format)
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