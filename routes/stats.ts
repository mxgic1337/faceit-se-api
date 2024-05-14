import express from 'express'
import {headers, PlayersResponse} from "../server";

export const statsRoute = express.Router()

export interface Matchv1 {
    teamId: string,
    i2: string,
    elo: string,
    competitionId: string
    created_at: number
}

const competitionId = 'f4148ddd-bce8-41b8-9131-ee83afcdd6dd'

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
            } else {
                const playerId = playersResponse.player_id
                const playerElo = playersResponse.games.cs2.faceit_elo
                const playerLevel = playersResponse.games.cs2.skill_level

                const startDate = new Date()
                startDate.setHours(0)
                startDate.setMinutes(0)
                startDate.setSeconds(0)

                fetch(`https://www.faceit.com/api/stats/v1/stats/time/users/${playerId}/games/cs2?size=100`).then(async response => {
                    if (response.ok) {
                        let matches = await response.json() as Matchv1[]

                        let wins = 0
                        let losses = 0

                        const todayMatches = matches.filter(match => startDate.getTime() <= match.created_at && match.competitionId === competitionId)
                        matches = matches.filter(match => !todayMatches.includes(match))

                        console.log(todayMatches.length)
                        console.log(matches[0].elo)

                        let eloDiff = 0
                        if (todayMatches.length > 0) {
                            let startElo = parseInt(todayMatches[todayMatches.length - 1].elo)
                            if (matches.length > 0) {
                                startElo = parseInt(matches[0].elo);
                            }
                            eloDiff = playerElo - startElo

                            for (const match of todayMatches) {
                                console.log(match.elo)
                                if (match.i2 === match.teamId) {
                                    wins += 1
                                } else {
                                    losses++
                                }
                            }
                        }
                        let format = req.query.format as string | undefined || `LVL: $lvl, ELO: $elo ($diff), Mecze: $winsW / $lossesL`
                        format = format
                            .replace('$lvl', String(playerLevel))
                            .replace('$elo', String(playerElo))
                            .replace('$diff', String(eloDiff > 0 ? `+${eloDiff}` : eloDiff))
                            .replace('$wins', String(wins))
                            .replace('$losses', String(losses))
                        res.send(format)
                        console.log(`%c /stats %c Zwrócono statystyki gracza %c${req.params.playerName}%c.`, 'background: #00ff33; color: #000;', 'color: #fff', 'color: #47ff6c', 'color: #fff;')
                    } else {
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