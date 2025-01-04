package utils

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
)

var API_KEY string = os.Getenv("FACEIT_API_KEY")
var API_V4_PREFIX string = "https://open.faceit.com/data/v4"
var API_V1_PREFIX string = "https://www.faceit.com/api/stats/v1"
var API_V1_MATCH_PREFIX string = "https://www.faceit.com/api/match/v1"

type Player struct {
	ID       string      `json:"player_id"`
	Username string      `json:"nickname"`
	Games    PlayerGames `json:"games"`
}

type PlayerGames struct {
	CS2 PlayerGameStats `json:"cs2"`
}

type PlayerGameStats struct {
	Level int `json:"skill_level"`
	Elo   int `json:"faceit_elo"`
}

type V1Match struct {
	Elo           string `json:"elo"`
	TeamID        string `json:"teamId"`
	CreatedAt     int64  `json:"created_at"`
	WinnerTeamID  string `json:"i2"`
	CompetitionID string `json:"competitionId"`
}

func StatsErrorMessage(w http.ResponseWriter, route string, username string, err error) {
	if err.Error() == "not found" {
		fmt.Fprintf(w, "Player %s not found.", username)
	} else {
		fmt.Fprintf(w, "An unknown error occured. Try again later!")
		fmt.Printf("[%s] Error: %s\n", route, err.Error())
	}
}

func GetPlayerInfo(username string) (*Player, error) {
	var player Player

	client := &http.Client{}
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/players?nickname=%s", API_V4_PREFIX, username), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Authorization", "Bearer "+API_KEY)
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != 200 {
		return nil, errors.New("not found")
	}
	if err := json.NewDecoder(resp.Body).Decode(&player); err != nil {
		fmt.Printf("Failed to decode JSON: %s\n", err.Error())
	}

	return &player, nil
}

func GetPlayerMatchHistory(id string, size int) (*[]V1Match, error) {
	var matches []V1Match

	client := &http.Client{}
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/stats/time/users/%s/games/cs2?size=%v", API_V1_PREFIX, id, size), nil)
	if err != nil {
		return nil, err
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != 200 {
		if resp.StatusCode == 404 {
			return nil, errors.New("not found")
		} else {
			return nil, fmt.Errorf("http %v", resp.StatusCode)
		}
	}
	if err := json.NewDecoder(resp.Body).Decode(&matches); err != nil {
		fmt.Println(err.Error())
	}

	return &matches, nil
}
