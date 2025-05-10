import express from 'express';
import { handleError } from '../server';
import {
  findUserProfile,
  getMatchV2,
  getPlayerOngoingMatchId,
} from '../util/user_util';

export const liveRoute = express.Router();

liveRoute.get('/:playerName', (req, res) => {
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

      getPlayerOngoingMatchId(player.id)
        .then((matchId) => {
          if (!matchId) {
            res.send(`${req.params.playerName} nie rozgrywa żadnego meczu.`);
            return;
          }

          getMatchV2(matchId)
            .then((match) => {
              if (req.query.m === '') {
                res.redirect(`https://www.faceit.com/pl/cs2/room/${matchId}`);
                return;
              }

              let format =
                (req.query.format as string | undefined) ||
                `Mapa: $map, Drużyna: $team, Wynik: $team1 ($team1elo ELO) $team1result:$team2result $team2 ($team2elo ELO), Pokój: $matchroom`;

              let team1Elo = 0;
              for (const player of match.teams.faction1.roster) {
                team1Elo += player.elo;
              }
              let team2Elo = 0;
              for (const player of match.teams.faction2.roster) {
                team2Elo += player.elo;
              }

              let playerTeam = 1;
              if (
                match.teams.faction1.roster.filter(
                  (player1) => player1.id === player.id
                ).length === 0
              ) {
                playerTeam = 2;
              }

              format = format
                .replace('$name', player.username)
                .replace('$map', match.voting.map.pick[0])
                .replace(
                  '$team1elo',
                  String(
                    Math.round(team1Elo / match.teams.faction1.roster.length)
                  )
                )
                .replace(
                  '$team1result',
                  match.results
                    ? String(match.results[0].factions.faction1.score)
                    : '0'
                )
                .replace(
                  '$team',
                  (match.teams as any)[`faction${playerTeam}`].name
                )
                .replace('$team1', match.teams.faction1.name)
                .replace(
                  '$team2elo',
                  String(
                    Math.round(team2Elo / match.teams.faction2.roster.length)
                  )
                )
                .replace(
                  '$team2result',
                  match.results
                    ? String(match.results[0].factions.faction2.score)
                    : '0'
                )
                .replace('$team2', match.teams.faction2.name)
                .replace(
                  '$matchroom',
                  `https://www.faceit.com/pl/cs2/room/${matchId}`
                );
              res.send(format);
            })
            .catch((err) => {
              handleError(err, res);
            });
        })
        .catch((err) => {
          handleError(err, res);
        });
    })
    .catch((err) => {
      handleError(err, res);
    });
});
