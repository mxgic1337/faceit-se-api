import express from 'express'
import {findUserProfile, getPlayerMatchStatsBulk} from "../util/user_util";
import {handleError} from "../server";

export const avgRoute = express.Router()

export const COMPETITION_ID = "f4148ddd-bce8-41b8-9131-ee83afcdd6dd";

avgRoute.get('/:playerName', (req, res) => {
    findUserProfile(req.params.playerName).then((player)=>{
        if (!player) {
            res.send(`Nie znaleziono gracza ${req.params.playerName}. Wielkość liter w nicku ma znaczenie.`)
            return;
        }

        if (!player.playsCS2) {
            res.send(`Ten gracz nigdy nie grał w CS2 na FACEIT.`)
            return
        }
        
        getPlayerMatchStatsBulk(player.id).then(matches_stats => {
            matches_stats = matches_stats.filter(match => match.stats['Competition Id'] === COMPETITION_ID)

            if (matches_stats.length === 0) {
                res.send(`Nie znaleziono gier z których można wyliczyć średnią.`)
                return
            }

            let kills = 0
            let kd = 0
            let kr = 0
            let headshots = 0
            let adr = 0
            let matches = 0

            for (const match of matches_stats) {
                if (matches >= 30) continue
                kills += parseInt(match.stats.Kills)
                kd += parseFloat(match.stats["K/D Ratio"])
                kr += parseFloat(match.stats["K/R Ratio"])
                headshots += parseFloat(match.stats["Headshots %"])
                if (match.stats["ADR"]) adr += parseFloat(match.stats["ADR"])
                matches++;
            }

            let format = req.query.format as string | undefined || `LVL: $lvl, Zabójstwa: $kills, K/D: $kd, K/R: $kr, ADR: $adr, % headshotów: $hspercent`
            format = format
                .replace('$name', player.username)
                .replace('$lvl', String(player.level))
                .replace('$kills', String(round(kills / matches)))
                .replace('$kd', String(round(kd / matches)))
                .replace('$kr', String(round(kr / matches)))
                .replace('$adr', String(round(adr / matches)))
                .replace('$hspercent', String(round(headshots / matches) + "%"))
            res.send(format)
        }).catch(err => {handleError(err, res)})
    }).catch(err => {handleError(err, res)})
})

function round(number: number) {
    return Math.floor((number * 100)) / 100
}
