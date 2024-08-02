import {
    FACEIT_URL_BASE_V1,
    FACEIT_URL_BASE_V1_MATCH,
    FACEIT_URL_BASE_V2_MATCH,
    FACEIT_URL_BASE_V4,
    HEADERS,
    HEADERS_NO_AUTHORIZATION
} from "./faceit_util";
import {PlayersResponse} from "../server";

/** Informacje o graczu */
type FACEITPlayer = {
    id: string,
    username: string,
    playsCS2: true,
    elo: number,
    level: number
} | {
    id: string,
    username: string,
    playsCS2: false,
}

/** Informacje o meczu zwracane przez API v1 */
export interface Matchv1 {
    matchId: string
    teamId: string,
    i2: string,
    elo: string,
    competitionId: string
    created_at: number
}

interface StatsResponse {
    "items": Stats[]
}

/** Statystyki gracza zwracane przez API v4 */
interface Stats {
    stats: {
        "Kills": string,
        "K/D Ratio": string,
        "K/R Ratio": string,
        "Headshots %": string,
        "Match Id": string,
        "ADR": string,
        "Competition Id": string,
    }
}

/** Statystyki z meczu zwracane przez API v4 */
export interface MatchStatsResponse {
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

export interface MatchStatsTeam {
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

export interface GroupByStateResponse {
    payload: {
        READY?: {
            id: string,
        }[],
        ONGOING?: {
            id: string,
        }[],
    }
}

/** Informacje o meczu zwracane przez API v2 */
export interface Matchv2 {
    id: string
    teams: {
        faction1: Matchv2Team,
        faction2: Matchv2Team,
    },
    voting: {
        map: {
            pick: string[]
        }
    },
    results: {
        factions: {
            faction1: {score: number},
            faction2: {score: number},
        }
    }[]
}

/** Informacje o drużynie zwracane przez API v2 */
export interface Matchv2Team {
    id: string
    name: string
    roster: {
        id: string,
        nickname: string,
        elo: number
        gameSkillLevel: number
    }[]
}

/**
 * Funkcja wyszukująca gracza po nazwie użytkownika.
 * @param username Nazwa użytkownika szukanego gracza.
 */
export function findUserProfile(username: string): Promise<FACEITPlayer | undefined> {
    return new Promise<FACEITPlayer | undefined>((resolve, reject) => {
        fetch(`${FACEIT_URL_BASE_V4}/players?nickname=${username}`, {headers: HEADERS}).then(async (res) => {
            if (res.ok) {
                const json = await res.json() as PlayersResponse
                if (json.games.cs2) {
                    resolve({
                        id: json.player_id,
                        username: json.nickname,
                        playsCS2: true,
                        elo: json.games.cs2.faceit_elo,
                        level: json.games.cs2.skill_level,
                    })
                }else{
                    resolve({
                        id: json.player_id,
                        username: json.nickname,
                        playsCS2: false,
                    })
                }
            } else {
                console.error(`Nie udało się pobrać danych o graczu ${username}: ${res.status} ${res.statusText}`)
                if (res.status === 404) {
                    resolve(undefined)
                } else {
                    reject(`${res.status} ${res.statusText} ${await res.text()}`)
                }
            }
        }).catch(err => {
            reject(err)
        })
    })
}

/**
 * Funkcja pobierająca informacje o meczach z historii meczów wybranego gracza.
 * @param id ID gracza od którego mają zostać pobrane statystyki
 * @param size Ilość meczów z których mają zostać pobrane statystyki
 */
export function getPlayerMatchHistory(id: string, size: number = 20) {
    return new Promise<Matchv1[]>((resolve, reject) => {
        fetch(`${FACEIT_URL_BASE_V1}/stats/time/users/${id}/games/cs2?size=${size}`, {headers: HEADERS_NO_AUTHORIZATION}).then(async response => {
            if (response.ok) {
                let matches = await response.json() as Matchv1[]
                resolve(matches)
            }else{
                reject(`${response.status} ${response.statusText}`)
            }
        }).catch(err => {
            reject(err)
        })
    })
}

/**
 * Funkcja pobierająca informacje o wybranym meczu.
 * @param id ID meczu z którego mają zostać pobrane informacje
 */
export function getMatchV2(id: string) {
    return new Promise<Matchv2>((resolve, reject) => {
        fetch(`${FACEIT_URL_BASE_V2_MATCH}/match/${id}`, {headers: HEADERS_NO_AUTHORIZATION}).then(async response => {
            if (response.ok) {
                resolve((await response.json() as {payload: Matchv2}).payload)
            }else{
                reject(`${response.status} ${response.statusText}`)
            }
        }).catch(err => {
            reject(err)
        })
    })
}

/**
 * Funkcja pobierająca statystyki z wybranego meczu.
 * @param matchId ID meczu z których mają zostać pobrane statystyki.
 */
export function getMatchStatsV4(matchId: string) {
    return new Promise<MatchStatsResponse>((resolve, reject) => {
        fetch(`${FACEIT_URL_BASE_V4}/matches/${matchId}/stats`, {headers: HEADERS}).then(async response => {
            if (response.ok) {
                resolve(await response.json() as MatchStatsResponse)
            }else{
                reject(`${response.status} ${response.statusText}`)
            }
        }).catch(err => {
            reject(err)
        })
    })
}

/**
 * Funkcja pobierająca statystyki z wielu meczów wybranego gracza.
 * @param id ID gracza od którego mają zostać pobrane statystyki
 * @param size Ilość meczów z których mają zostać pobrane statystyki
 */
export function getPlayerMatchStatsBulk(id: string, size: number = 20) {
    return new Promise<Stats[]>((resolve, reject) => {
        fetch(`${FACEIT_URL_BASE_V4}/players/${id}/games/cs2/stats?offset=0&limit=${size}`, {headers: HEADERS}).then(async response => {
            if (response.ok) {
                resolve((await response.json() as StatsResponse).items)
            }else{
                reject(`${response.status} ${response.statusText}`)
            }
        }).catch(err => {
            reject(err)
        })
    })
}

/**
 * Funkcja pobierająca ID aktualnego meczu wybranego gracza.
 * @param playerId ID gracza
 */
export function getPlayerOngoingMatchId(playerId: string) {
    return new Promise<string | undefined>((resolve, reject) => {
        fetch(`${FACEIT_URL_BASE_V1_MATCH}/matches/groupByState?userId=${playerId}`, {headers: HEADERS_NO_AUTHORIZATION}).then(async response => {
            if (response.ok) {
                const json = (await response.json() as GroupByStateResponse)
                if (!json.payload.ONGOING || json.payload.ONGOING.length === 0) {
                    resolve(undefined)
                    return
                }
                resolve(json.payload.ONGOING[0].id)
            }else{
                reject(`${response.status} ${response.statusText}`)
            }
        }).catch(err => {
            reject(err)
        })
    })
}