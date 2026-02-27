import {
  faceitApiClient,
} from './faceit_util';
import { PlayersResponse } from '../server';

interface ListResponse<T> {
  items: T
}

/** Informacje o graczu */
type FACEITPlayer =
  | {
    id: string;
    username: string;
    playsCS2: true;
    elo: number;
    level: number;
  }
  | {
    id: string;
    username: string;
    playsCS2: false;
  };

/** Informacje o meczu zwracane przez API v4 */
export interface Match {
  match_id: string;
  teams: {
    faction1: Team,
    faction2: Team,
  };
  results: {
    winner: string
  }
  competition_id: string;
  started_at: number;
}

interface Team {
  team_id: string
  players: { player_id: string }[]
}

/** Statystyki gracza zwracane przez API v4 */
interface Stats {
  stats: {
    Kills: string;
    'K/D Ratio': string;
    'K/R Ratio': string;
    'Headshots %': string;
    'Match Id': string;
    ADR: string;
    'Competition Id': string;
  };
}

/** Statystyki z meczu zwracane przez API v4 */
export interface MatchStatsResponse {
  rounds: [
    {
      round_stats: {
        Map: string;
        Score: string;
        Winner: string;
      };
      teams: MatchStatsTeam[];
    },
  ];
}

export interface MatchStatsTeam {
  team_id: string;
  players: {
    player_id: string;
    player_stats: {
      Kills: string;
      Assists: string;
      Deaths: string;
      'K/D Ratio': string;
      'K/R Ratio': string;
      'Headshots %': string;
      ADR: string;
    };
  }[];
}

export interface GroupByStateResponse {
  payload: {
    READY?: {
      id: string;
    }[];
    ONGOING?: {
      id: string;
    }[];
  };
}

/** Informacje o meczu zwracane przez API v2 */
export interface Matchv2 {
  id: string;
  teams: {
    faction1: Matchv2Team;
    faction2: Matchv2Team;
  };
  voting: {
    map: {
      pick: string[];
    };
  };
  results: {
    factions: {
      faction1: { score: number };
      faction2: { score: number };
    };
  }[];
}

/** Informacje o drużynie zwracane przez API v2 */
export interface Matchv2Team {
  id: string;
  name: string;
  roster: {
    id: string;
    nickname: string;
    elo: number;
    gameSkillLevel: number;
  }[];
}

/**
 * Funkcja wyszukująca gracza po nazwie użytkownika.
 * @param username Nazwa użytkownika szukanego gracza.
 */
export function findUserProfile(
  username: string
): Promise<FACEITPlayer | undefined> {
  return new Promise<FACEITPlayer | undefined>((resolve, reject) => {
    faceitApiClient.get(`/players?nickname=${username}`)
      .then(async (res) => {
        const player = res.data as PlayersResponse;
        if (player.games.cs2) {
          resolve({
            id: player.player_id,
            username: player.nickname,
            playsCS2: true,
            elo: player.games.cs2.faceit_elo,
            level: player.games.cs2.skill_level,
          });
        } else {
          resolve({
            id: player.player_id,
            username: player.nickname,
            playsCS2: false,
          });
        }
      })
      .catch((err) => {
        console.error(
          `Nie udało się pobrać danych o graczu ${username}: ${err.response.status} ${err.response.statusText}`
        );
        if (err.response.status === 404) {
          resolve(undefined);
        } else {
          reject(`${err.response.status} ${err.response.statusText}`);
        }
        reject(err);
      });
  });
}

/**
 * Funkcja pobierająca informacje o meczach z historii meczów wybranego gracza.
 * @param id ID gracza od którego mają zostać pobrane statystyki
 * @param size Ilość meczów z których mają zostać pobrane statystyki
 */
export function getPlayerMatchHistory(id: string, size: number = 20) {
  return new Promise<Match[]>((resolve, reject) => {
    faceitApiClient.get(`/players/${id}/history?game=cs2&limit=${size}`).then((response) => {
      let matches = (response.data as ListResponse<Match[]>).items;
      resolve(matches);
    }).catch(err => {
      reject(err);
    })
  });
}

/**
 * Funkcja pobierająca statystyki z wybranego meczu.
 * @param matchId ID meczu z których mają zostać pobrane statystyki.
 */
export function getMatchStatsV4(matchId: string) {
  return new Promise<MatchStatsResponse>((resolve, reject) => {
    faceitApiClient.get(`/matches/${matchId}/stats`)
      .then(async (response) => {
        resolve(response.data as MatchStatsResponse);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Funkcja pobierająca statystyki z wielu meczów wybranego gracza.
 * @param id ID gracza od którego mają zostać pobrane statystyki
 * @param size Ilość meczów z których mają zostać pobrane statystyki
 */
export function getPlayerMatchStatsBulk(id: string, size: number = 100) {
  return new Promise<Stats[]>((resolve, reject) => {
    faceitApiClient.get(
      `/players/${id}/games/cs2/stats?offset=0&limit=${size}`
    )
      .then(async (response) => {
        resolve((response.data as ListResponse<Stats[]>).items);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
