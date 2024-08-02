import express from 'express'
import {findUserProfile, getMatchStatsV4, getPlayerMatchHistory, MatchStatsTeam} from "../util/user_util";
import {handleError} from "../server";

export const lastRoute = express.Router()

lastRoute.get('/:playerName', (req, res) => {
    findUserProfile(req.params.playerName).then(player => {
        if (!player) {
            res.send(`Nie znaleziono gracza ${req.params.playerName}. Wielkość liter w nicku ma znaczenie.`)
            return;
        }

        if (!player.playsCS2) {
            res.send(`Ten gracz nigdy nie grał w CS2 na FACEIT.`)
            return
        }

        getPlayerMatchHistory(player.id).then(matches => {
            matches = matches.filter(match => match.elo)
            if (matches.length === 0) {
                res.send('Nie znaleziono meczu z którego można wyliczyć statystyki.')
                return
            }
            getMatchStatsV4(matches[0].matchId).then(matchStats => {
                let playersTeam: MatchStatsTeam | undefined = undefined
                let enemyTeam: MatchStatsTeam | undefined = undefined

                if (matchStats.rounds[0].teams[0].players.filter(player1 => player1.player_id === player.id)[0]) {
                    playersTeam = matchStats.rounds[0].teams[0]
                    enemyTeam = matchStats.rounds[0].teams[1]
                }else if (matchStats.rounds[0].teams[1].players.filter(player1 => player1.player_id === player.id)[0]) {
                    playersTeam = matchStats.rounds[0].teams[1]
                    enemyTeam = matchStats.rounds[0].teams[0]
                }

                if (!playersTeam || !enemyTeam) {
                    res.send('Wystąpił błąd. Spróbuj ponownie później.')
                    return
                }

                const playerStats = playersTeam.players.filter(player1 => player1.player_id === player.id)[0]

                let format = req.query.format as string | undefined || `Mapa: $map, Wynik: $score ($result), ELO: $diff, Zabójstwa: $kills ($hspercent% HS), Śmierci: $deaths, K/D: $kd, ADR: $adr`
                const eloDiff = matches.length >= 2 ? isNaN(parseInt(matches[0].elo)) ? player.elo - parseInt(matches[1].elo) : parseInt(matches[0].elo) - parseInt(matches[1].elo) : 0
                format = format
                    .replace('$name', player.username)
                    .replace('$result',
                        matchStats.rounds[0].round_stats.Winner === playersTeam.team_id ? "Wygrana" : "Przegrana")
                    .replace('$map', matchStats.rounds[0].round_stats.Map)
                    .replace('$score', matchStats.rounds[0].round_stats.Score)
                    .replace('$kills', String(playerStats.player_stats.Kills))
                    .replace('$assists', String(playerStats.player_stats.Assists))
                    .replace('$deaths', String(playerStats.player_stats.Deaths))
                    .replace('$adr', String(playerStats.player_stats.ADR))
                    .replace('$kd', String(playerStats.player_stats["K/D Ratio"]))
                    .replace('$kr', String(playerStats.player_stats["K/R Ratio"]))
                    .replace('$hspercent', String(playerStats.player_stats["Headshots %"]))
                    .replace('$diff', String(eloDiff > 0 ? `+${eloDiff}` : eloDiff))
                res.send(format)
            }).catch(err => {handleError(err, res)})
        }).catch(err => {handleError(err, res)})
    }).catch(err => {handleError(err, res)})
})