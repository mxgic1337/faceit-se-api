import express from 'express'
import {headers, PlayersResponse} from "../server";

export const avgRoute = express.Router()

interface StatsResponse {
    items: [
        {"stats": {
            "Kills": string,
            "K/D Ratio": string,
            "K/R Ratio": string,
            "Headshots %": string,
        }}
    ]
}

avgRoute.get('/:playerName', (req, res) => {
    console.log(`%c /avg %c Pobieranie statystyk gracza %c${req.params.playerName}%c...`, 'background: #002fff; color: #fff;', 'color: #fff', 'color: #4a6bff', 'color: #fff;')

    fetch(`https://open.faceit.com/data/v4/players?nickname=${req.params.playerName}&game=cs2`, {
        headers: headers
    }).then(async response => {
        if (response.ok) {
            const playersResponse = (await response.json() as PlayersResponse)

            if (!playersResponse.games.cs2) {
                res.send(`Ten gracz nigdy nie grał w CS2 na FACEIT.`)
                console.log(`%c /avg %c Gracz %c${req.params.playerName}%c nigdy nie grał w CS2 na FACEIT.`, 'background: #002fff; color: #fff;', 'color: #fff', 'color: #4a6bff', 'color: #fff;')
                return
            }else{
                const playerId = playersResponse.player_id

                fetch(`https://open.faceit.com/data/v4/players/${playerId}/games/cs2/stats?offset=0&limit=20`, {headers}).then(async response => {
                    if (response.ok) {
                        const statsResponse = await response.json() as StatsResponse
                        const matches = statsResponse.items;

                        let kills = 0
                        let kd = 0
                        let kr = 0
                        let headshots = 0
                        for (const match of matches) {
                            kills += parseInt(match.stats.Kills)
                            kd += parseFloat(match.stats["K/D Ratio"])
                            kr += parseFloat(match.stats["K/R Ratio"])
                            headshots += parseFloat(match.stats["Headshots %"])
                        }

                        let format = req.query.format as string | undefined || `Zabójstwa: $kills, K/D: $kd, K/R: $kr, % headshotów: $hspercent`
                        format = format
                            .replace('$kills', String(round(kills/matches.length)))
                            .replace('$kd', String(round(kd/matches.length)))
                            .replace('$kr', String(round(kr/matches.length)))
                            .replace('$hspercent', String(round(headshots/matches.length) + "%"))
                        res.send(format)
                        console.log(`%c /avg %c Zwrócono statystyki gracza %c${req.params.playerName}%c.`, 'background: #00ff33; color: #000;', 'color: #fff', 'color: #47ff6c', 'color: #fff;')
                    }else{
                        res.send(`Wystąpił błąd. Spróbuj ponownie później.`)
                        console.log(`%c /avg %c %c ${response.status} %c Wystąpił błąd: %c${await response.text()}`, 'background: #ff1c1c; color: #fff;', 'color: #fff', 'background: #ff1c1c; color: #fff;', 'color: #fff;', 'color: #ff4a4a')
                    }
                })
            }
        } else {
            if (response.status === 404) {
                res.send(`Nie znaleziono gracza ${req.params.playerName} na FACEIT.`)
                console.log(`%c /avg %c %c 404 %c Nie znaleziono gracza %c${req.params.playerName}`, 'background: #ff1c1c; color: #fff;', 'color: #fff', 'background: #ff1c1c; color: #fff;', 'color: #fff;', 'color: #ff4a4a')
            } else {
                res.send(`Wystąpił błąd. Spróbuj ponownie później.`)
                console.log(`%c /avg %c %c ${response.status} %c Wystąpił błąd: %c${await response.text()}`, 'background: #ff1c1c; color: #fff;', 'color: #fff', 'background: #ff1c1c; color: #fff;', 'color: #fff;', 'color: #ff4a4a')
            }
        }
    })
})

function round(number: number) {
    return Math.floor((Math.round((number * 100)) / 100))
}