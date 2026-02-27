import express from 'express';
import { COMPETITION_ID } from './avg';
import { findUserProfile, getPlayerMatchHistory } from '../util/user_util';
import { handleError } from '../server';

export const statsRoute = express.Router();

statsRoute.get('/:playerName', (req, res) => {
  findUserProfile(req.params.playerName)
    .then((player) => {
      if (!player) {
        res.send(
          `Nie znaleziono gracza ${req.params.playerName}. Wielkość liter w nicku ma znaczenie.`
        );
        return;
      }

      if (!player.playsCS2) {
        res.send(`Ten gracz nigdy nie grał w CS2 na FACEIT.`);
        return;
      }

      let startDate = new Date();
      startDate.setHours(0);
      startDate.setMinutes(0);
      startDate.setSeconds(0);
      let size = 100;

      if (req.query.startDate && !isNaN(Number(req.query.startDate))) {
        startDate = new Date(Number(req.query.startDate));
        size = 500;
      }

      getPlayerMatchHistory(player.id, size)
        .then((matches) => {
          if (matches.length === 0) {
            res.send(
              'Nie znaleziono meczów z których można wyliczyć statystyki.'
            );
            return;
          }

          let wins = 0;
          let losses = 0;

          const todayMatches = matches.filter(
            (match) =>
              startDate.getTime() <= match.started_at * 1000 &&
              match.competition_id === COMPETITION_ID
          );

          if (todayMatches.length > 0) {
            for (const match of todayMatches) {
              let teamId;

              if (match.teams.faction1.players.find((teamPlayer) => teamPlayer.player_id === player.id)) {
                teamId = 'faction1';
              }
              else if (match.teams.faction2.players.find((teamPlayer) => teamPlayer.player_id === player.id)) {
                teamId = 'faction2';
              }

              if (!teamId) continue;

              if (match.results.winner === teamId) {
                wins++;
              } else {
                losses++;
              }
            }
          }

          let format =
            (req.query.format as string | undefined) ||
            `LVL: $lvl, ELO: $elo, Mecze: $winsW / $lossesL`;
          format = format
            .replace('$name', player.username)
            .replace('$lvl', String(player.level))
            .replace('$elo', String(player.elo))
            .replace('$diff', String('?'))
            .replace('$wins', String(wins))
            .replace('$losses', String(losses));
          res.send(format);
        })
        .catch((err) => {
          handleError(err, res);
        });
    })
    .catch((err) => {
      handleError(err, res);
    });
});
