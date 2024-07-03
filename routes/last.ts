import express from 'express'
import {clog, handleError, HEADERS, HEADERS_NO_AUTHORIZATION, PlayersResponse} from "../server";
import {Matchv1} from "./stats";
import {COMPETITION_ID} from "./avg";

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
            "ADR": string,
        }
    }[]
}

lastRoute.get('/:playerName', (req, res) => {
    fetch(`https://open.faceit.com/data/v4/players?nickname=${req.params.playerName}&game=cs2`, {
        headers: HEADERS
    }).then(async response => {
        if (response.ok) {
            const playersResponse = (await response.json() as PlayersResponse)

            if (!playersResponse.games.cs2) {
                res.send(`Ten gracz nigdy nie grał w CS2 na FACEIT.`)
                return
            }else{
                const playerId = playersResponse.player_id
                const playerElo = playersResponse.games.cs2.faceit_elo
                fetch(`https://www.faceit.com/api/stats/v1/stats/time/users/${playerId}/games/cs2?size=20`, {headers: HEADERS_NO_AUTHORIZATION}).then(async response => {
                    if (response.ok) {
                        let matches = await response.json() as Matchv1[]

                        if (matches.length === 0) {
                            res.send('Nie znaleziono meczu z którego można wyliczyć statystyki.')
                        }else{
                            fetch(`https://open.faceit.com/data/v4/matches/${matches[0].matchId}/stats`, {headers: HEADERS}).then(async response => {
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

                                    let format = req.query.format as string | undefined || `Mapa: $map, Wynik: $score ($result), ELO: $diff, Zabójstwa: $kills ($hspercent% HS), Śmierci: $deaths, K/D: $kd, ADR: $adr`
                                    const eloDiff = matches.length >= 2 ? isNaN(parseInt(matches[0].elo)) ? playerElo - parseInt(matches[1].elo) : parseInt(matches[0].elo) - parseInt(matches[1].elo) : 0
                                    format = format
                                        .replace('$result',
                                            matchStats.rounds[0].round_stats.Winner === playersTeam.team_id ? "Wygrana" : "Przegrana")
                                        .replace('$map', matchStats.rounds[0].round_stats.Map)
                                        .replace('$score', matchStats.rounds[0].round_stats.Score)
                                        .replace('$kills', String(player.player_stats.Kills))
                                        .replace('$assists', String(player.player_stats.Assists))
                                        .replace('$deaths', String(player.player_stats.Deaths))
                                        .replace('$adr', String(player.player_stats.ADR))
                                        .replace('$kd', String(player.player_stats["K/D Ratio"]))
                                        .replace('$kr', String(player.player_stats["K/R Ratio"]))
                                        .replace('$hspercent', String(player.player_stats["Headshots %"]))
                                        .replace('$diff', String(eloDiff > 0 ? `+${eloDiff}` : eloDiff))
                                    res.send(format)
                                }else{
                                    res.send(`Wystąpił błąd podczas szukania statystyk. Spróbuj ponownie później.`)
                                    clog('/last', 'error', `${await response.text()} (${response.status})`)
                                }
                            }).catch((err)=>handleError(err, res))
                        }
                    }else{
                        res.send(`Wystąpił błąd podczas szukania historii meczów. Spróbuj ponownie później. (Serwer zwrócił kod: ${response.status})`)
                        clog('/last', 'error', `${await response.text()} (${response.status})`)
                    }
                }).catch((err)=>handleError(err, res))
            }
        } else {
            if (response.status === 404) {
                res.send(`Nie znaleziono gracza ${req.params.playerName} na FACEIT. Wielkość liter w nicku ma znaczenie.`)
            } else {
                res.send(`Wystąpił błąd. Spróbuj ponownie później. (Serwer zwrócił kod: ${response.status})`)
                clog('/last', 'error', `${await response.text()} (${response.status})`)
            }
        }
    }).catch((err)=>handleError(err, res))
})