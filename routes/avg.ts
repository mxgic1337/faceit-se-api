import express from 'express'
import {clog, handleError, HEADERS, PlayersResponse} from "../server";

export const avgRoute = express.Router()

export const COMPETITION_ID = "f4148ddd-bce8-41b8-9131-ee83afcdd6dd";

interface StatsResponse {
    items: {
        "stats": {
            "Kills": string,
            "K/D Ratio": string,
            "K/R Ratio": string,
            "Headshots %": string,
            "Match Id": string,
            "ADR": string,
            "Competition Id": string,
        }
    }[]
}

avgRoute.get('/:playerName', (req, res) => {
    fetch(`https://open.faceit.com/data/v4/players?nickname=${req.params.playerName}&game=cs2`, {
        headers: HEADERS
    }).then(async response => {
        if (response.ok) {
            const playersResponse = (await response.json() as PlayersResponse)
            const playerId = playersResponse.player_id

            if (!playersResponse.games.cs2) {
                res.send(`Ten gracz nigdy nie grał w CS2 na FACEIT.`)
            }else{
                const playerLevel = playersResponse.games.cs2.skill_level
                fetch(`https://open.faceit.com/data/v4/players/${playerId}/games/cs2/stats?offset=0&limit=50`, {headers: HEADERS}).then(async response => {
                    if (response.ok) {
                        const statsResponse = await response.json() as StatsResponse
                        let matches_stats = statsResponse.items;
                        matches_stats = matches_stats.filter(match => match.stats['Competition Id'] === COMPETITION_ID)

                        if (matches_stats.length === 0) {
                            res.send(`Nie znaleziono gier z których można wyliczyć średnią.`)
                        }else{
                            let kills = 0
                            let kd = 0
                            let kr = 0
                            let headshots = 0
                            let adr = 0
                            let matches = 0

                            for (const match of matches_stats) {
                                if (matches >= 20) continue
                                kills += parseInt(match.stats.Kills)
                                kd += parseFloat(match.stats["K/D Ratio"])
                                kr += parseFloat(match.stats["K/R Ratio"])
                                headshots += parseFloat(match.stats["Headshots %"])
                                if (match.stats["ADR"]) adr += parseFloat(match.stats["ADR"])
                                matches++;
                            }

                            let format = req.query.format as string | undefined || `LVL: $lvl, Zabójstwa: $kills, K/D: $kd, K/R: $kr, ADR: $adr, % headshotów: $hspercent`
                            format = format
                                .replace('$lvl', String(playerLevel))
                                .replace('$kills', String(round(kills / matches)))
                                .replace('$kd', String(round(kd / matches)))
                                .replace('$kr', String(round(kr / matches)))
                                .replace('$adr', String(round(adr / matches)))
                                .replace('$hspercent', String(round(headshots / matches) + "%"))
                            res.send(format)
                        }
                    } else {
                        res.send(`Wystąpił błąd. Spróbuj ponownie później. (Serwer zwrócił kod: ${response.status})`)
                        clog('/avg', 'error', `${await response.text()} (${response.status})`)
                    }
                }).catch((err)=>handleError(err, res))
            }
        } else {
            if (response.status === 404) {
                res.send(`Nie znaleziono gracza ${req.params.playerName} na FACEIT. Wielkość liter w nicku ma znaczenie.`)
            } else {
                res.send(`Wystąpił błąd. Spróbuj ponownie później. (Serwer zwrócił kod: ${response.status})`)
                clog('/avg', 'error', `${await response.text()} (${response.status})`)
            }
        }
    }).catch((err)=>handleError(err, res))
})

function round(number: number) {
    return Math.floor((number * 100)) / 100
}