import express from 'express'
import {clog, handleError, HEADERS, HEADERS_NO_AUTHORIZATION, PlayersResponse} from "../server";

export const liveRoute = express.Router()

interface GroupByStateResponse {
    payload: {
        READY?: {
            id: string,
        }[],
        ONGOING?: {
            id: string,
        }[],
    }
}

export interface Matchv2 {
    id: string
    teams: {
        faction1: Matchv2Team,
        faction2: Matchv2Team,
    },
    matchCustom: {
        tree: {
            map: {
                values: {
                    value: {game_map_id: string}[]
                }
            }
        },
    },
    results: {
        factions: {
            faction1: {score: number},
            faction2: {score: number},
        }
    }[]
}

interface Matchv2Team {
    id: string
    name: string
    roster: {
        id: string,
        nickname: string,
        elo: number
        gameSkillLevel: number
    }[]
}

liveRoute.get('/:playerName', (req, res) => {
    fetch(`https://open.faceit.com/data/v4/players?nickname=${req.params.playerName}&game=cs2`, {
        headers: HEADERS
    }).then(async response => {
        if (response.ok) {
            const playersResponse = (await response.json() as PlayersResponse)
            const playerId = playersResponse.player_id

            fetch(`https://www.faceit.com/api/match/v1/matches/groupByState?userId=${playerId}`, {headers: HEADERS_NO_AUTHORIZATION, cache: 'no-cache'}).then(async response => {
                if (response.ok) {
                    const groupByStateResponse = await response.json() as GroupByStateResponse
                    if (groupByStateResponse.payload.ONGOING) {
                        const matchId = groupByStateResponse.payload.ONGOING[0].id;
                        fetch(`https://www.faceit.com/api/match/v2/match/${matchId}`, {headers: HEADERS_NO_AUTHORIZATION}).then(async response => {
                            if (response.ok) {
                                if (req.query.m === "") {
                                    res.redirect(`https://www.faceit.com/pl/cs2/room/${matchId}`)
                                    return
                                }

                                const matchResponse = (await response.json() as {payload: Matchv2}).payload
                                if (matchResponse) {
                                    let format = req.query.format as string | undefined || `Mapa: $map, Drużyna: $team, Wynik: $team1 ($team1elo ELO) $team1result:$team2result $team2 ($team2elo ELO), Pokój: $matchroom`

                                    let team1Elo = 0
                                    for (const player of matchResponse.teams.faction1.roster) {
                                        team1Elo += player.elo
                                    }
                                    let team2Elo = 0
                                    for (const player of matchResponse.teams.faction2.roster) {
                                        team2Elo += player.elo
                                    }

                                    let playerTeam = 1
                                    if (matchResponse.teams.faction1.roster.filter(player => player.id === playerId).length === 0) {
                                        playerTeam = 2
                                    }

                                    format = format
                                        .replace('$map', matchResponse.matchCustom.tree.map.values.value[0].game_map_id)
                                        .replace('$team1elo', String(Math.round(team1Elo/matchResponse.teams.faction1.roster.length)))
                                        .replace('$team1result', matchResponse.results ? String(matchResponse.results[0].factions.faction1.score) : "0")
                                        .replace('$team', (matchResponse.teams as any)[`faction${playerTeam}`].name)
                                        .replace('$team1', matchResponse.teams.faction1.name)
                                        .replace('$team2elo', String(Math.round(team2Elo/matchResponse.teams.faction2.roster.length)))
                                        .replace('$team2result', matchResponse.results ? String(matchResponse.results[0].factions.faction2.score) : "0")
                                        .replace('$team2', matchResponse.teams.faction2.name)
                                        .replace('$matchroom', `https://fc.mxgic1337.xyz/live/${req.params.playerName}?m`)
                                    res.send(format)
                                }else{
                                    res.send(`Wystąpił błąd: Nie znaleziono meczu.`)
                                    clog('/live', 'error', `${await response.text()} (${response.status})`)
                                }
                            } else {
                                res.send(`Wystąpił błąd. Spróbuj ponownie później. (Serwer zwrócił kod: ${response.status})`)
                                clog('/live', 'error', `${await response.text()} (${response.status})`)
                            }
                        }).catch((err)=>handleError(err, res))
                    }else{
                        res.send(`Ten gracz nie rozgrywa aktualnie żadnego meczu.`)
                    }
                } else {
                    res.send(`Wystąpił błąd. Spróbuj ponownie później. (Serwer zwrócił kod: ${response.status})`)
                    clog('/live', 'error', `${await response.text()} (${response.status})`)
                }
            }).catch((err)=>handleError(err, res))
        } else {
            if (response.status === 404) {
                res.send(`Nie znaleziono gracza ${req.params.playerName} na FACEIT. Wielkość liter w nicku ma znaczenie.`)
            } else {
                res.send(`Wystąpił błąd. Spróbuj ponownie później. (Serwer zwrócił kod: ${response.status})`)
                clog('/live', 'error', `${await response.text()} (${response.status})`)
            }
        }
    }).catch((err)=>handleError(err, res))
})