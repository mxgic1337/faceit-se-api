import express from 'express'
import {clog, handleError, HEADERS, HEADERS_NO_AUTHORIZATION, PlayersResponse} from "../server";
import {COMPETITION_ID} from "./avg";

export const statsRoute = express.Router()

export interface Matchv1 {
    matchId: string
    teamId: string,
    i2: string,
    elo: string,
    competitionId: string
    created_at: number
}

statsRoute.get('/:playerName', (req, res) => {
    fetch(`https://open.faceit.com/data/v4/players?nickname=${req.params.playerName}&game=cs2`, {
        headers: HEADERS
    }).then(async response => {
        if (response.ok) {
            const playersResponse = (await response.json() as PlayersResponse)

            if (!playersResponse.games.cs2) {
                res.send(`Ten gracz nigdy nie grał w CS2 na FACEIT.`)
                return
            } else {
                const playerId = playersResponse.player_id
                const playerElo = playersResponse.games.cs2.faceit_elo
                const playerLevel = playersResponse.games.cs2.skill_level

                let startDate = new Date()
                startDate.setHours(0)
                startDate.setMinutes(0)
                startDate.setSeconds(0)
                let size = 100

                if (req.query.startDate && !isNaN(Number(req.query.startDate))) {
                    startDate = new Date(Number(req.query.startDate))
                    size = 500
                }

                fetch(`https://www.faceit.com/api/stats/v1/stats/time/users/${playerId}/games/cs2?size=${size}`, {headers: HEADERS_NO_AUTHORIZATION}).then(async response => {
                    if (response.ok) {
                        let matches = await response.json() as Matchv1[]

                        let wins = 0
                        let losses = 0

                        const todayMatches = matches.filter(match => startDate.getTime() <= match.created_at && match.competitionId === COMPETITION_ID)
                        matches = matches.filter(match => !todayMatches.includes(match) && match.competitionId === COMPETITION_ID)

                        let eloDiff = 0
                        if (todayMatches.length > 0) {
                            let startElo = parseInt(todayMatches[todayMatches.length - 1].elo)
                            if (matches.length > 0) {
                                startElo = parseInt(matches[0].elo);
                            }
                            eloDiff = playerElo - startElo

                            for (const match of todayMatches) {
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
                        if (format === 'json') {
                            res.json({
                                level: playerLevel,
                                elo: playerElo,
                                diff: eloDiff,
                                wins: wins,
                                losses: losses,
                            })
                        }else{
                            res.send(format)
                        }
                    } else {
                        res.send(`Wystąpił błąd. Spróbuj ponownie później. (Serwer zwrócił kod: ${response.status})`)
                        clog('/stats', 'error', `${await response.text()} (${response.status})`)
                    }
                }).catch((err)=>handleError(err, res))
            }
        } else {
            if (response.status === 404) {
                res.send(`Nie znaleziono gracza ${req.params.playerName} na FACEIT. Wielkość liter w nicku ma znaczenie.`)
            } else {
                res.send(`Wystąpił błąd. Spróbuj ponownie później. (Serwer zwrócił kod: ${response.status})`)
                clog('/stats', 'error', `${await response.text()} (${response.status})`)
            }
        }
    }).catch((err)=>handleError(err, res))
})