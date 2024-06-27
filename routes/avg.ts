import express from 'express'
import {handleError, HEADERS, PlayersResponse} from "../server";

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
            "Competition Id": string,
        }
    }[]
}

avgRoute.get('/:playerName', (req, res) => {
    console.log(`%c /avg %c Pobieranie statystyk gracza %c${req.params.playerName}%c...`, 'background: #002fff; color: #fff;', 'color: #fff', 'color: #4a6bff', 'color: #fff;')

    fetch(`https://open.faceit.com/data/v4/players?nickname=${req.params.playerName}&game=cs2`, {
        headers: HEADERS
    }).then(async response => {
        if (response.ok) {
            const playersResponse = (await response.json() as PlayersResponse)
            const playerId = playersResponse.player_id

            fetch(`https://open.faceit.com/data/v4/players/${playerId}/games/cs2/stats?offset=0&limit=50`, {headers: HEADERS}).then(async response => {
                if (response.ok) {
                    const statsResponse = await response.json() as StatsResponse
                    let matches_stats = statsResponse.items;
                    matches_stats = matches_stats.filter(match => match.stats['Competition Id'] === COMPETITION_ID)

                    if (matches_stats.length === 0) {
                        res.send(`Nie znaleziono gier z których można wyliczyć średnią.`)
                        console.log(`%c /avg %c %cWystąpił błąd: Nie znaleziono gier z których można wyliczyć średnią.`, 'background: #ff1c1c; color: #fff;', 'color: #fff', 'background: #ff1c1c; color: #fff;', 'color: #fff;', 'color: #ff4a4a')
                    }else{
                        let kills = 0
                        let kd = 0
                        let kr = 0
                        let headshots = 0
                        let matches = 0

                        for (const match of matches_stats) {
                            if (matches >= 20) continue
                            kills += parseInt(match.stats.Kills)
                            kd += parseFloat(match.stats["K/D Ratio"])
                            kr += parseFloat(match.stats["K/R Ratio"])
                            headshots += parseFloat(match.stats["Headshots %"])
                            matches++;
                        }

                        let format = req.query.format as string | undefined || `Zabójstwa: $kills, K/D: $kd, K/R: $kr, % headshotów: $hspercent`
                        format = format
                            .replace('$kills', String(round(kills / matches)))
                            .replace('$kd', String(round(kd / matches)))
                            .replace('$kr', String(round(kr / matches)))
                            .replace('$hspercent', String(round(headshots / matches) + "%"))
                        res.send(format)
                        console.log(`%c /avg %c Zwrócono statystyki gracza %c${req.params.playerName}%c.`, 'background: #00ff33; color: #000;', 'color: #fff', 'color: #47ff6c', 'color: #fff;')
                    }
                } else {
                    res.send(`Wystąpił błąd. Spróbuj ponownie później. (Serwer zwrócił kod: ${response.status})`)
                    console.log(`%c /avg %c %c ${response.status} %c Wystąpił błąd: %c${await response.text()}`, 'background: #ff1c1c; color: #fff;', 'color: #fff', 'background: #ff1c1c; color: #fff;', 'color: #fff;', 'color: #ff4a4a')
                }
            }).catch((err)=>handleError(err, res))
        } else {
            if (response.status === 404) {
                res.send(`Nie znaleziono gracza ${req.params.playerName} na FACEIT.`)
                console.log(`%c /avg %c %c 404 %c Nie znaleziono gracza %c${req.params.playerName}`, 'background: #ff1c1c; color: #fff;', 'color: #fff', 'background: #ff1c1c; color: #fff;', 'color: #fff;', 'color: #ff4a4a')
            } else {
                res.send(`Wystąpił błąd. Spróbuj ponownie później. (Serwer zwrócił kod: ${response.status})`)
                console.log(`%c /avg %c %c ${response.status} %c Wystąpił błąd: %c${await response.text()}`, 'background: #ff1c1c; color: #fff;', 'color: #fff', 'background: #ff1c1c; color: #fff;', 'color: #fff;', 'color: #ff4a4a')
            }
        }
    }).catch((err)=>handleError(err, res))
})

function round(number: number) {
    return Math.floor((number * 100)) / 100
}