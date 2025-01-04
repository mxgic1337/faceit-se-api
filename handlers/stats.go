package handlers

import (
	"faceit-se-api/utils"
	"fmt"
	"net/http"
	"strconv"
	"time"
)

func StatsHandler(w http.ResponseWriter, r *http.Request) {
	route := "/stats"
	username := r.PathValue("username")
	player, err := utils.GetPlayerInfo(username)
	if err != nil {
		utils.StatsErrorMessage(w, route, username, err)
		return
	}
	matches, err := utils.GetPlayerMatchHistory(player.ID, 100)
	if err != nil {
		utils.StatsErrorMessage(w, route, username, err)
		return
	}
	wins := 0
	losses := 0

	var startingElo int
	currentTime := time.Now()
	startTime := time.Date(currentTime.Year(), currentTime.Month(), currentTime.Day(), 0, 0, 0, 0, time.Local)

	for _, match := range *matches {
		if match.CreatedAt < startTime.UnixMilli() {
			if startingElo == 0 {
				val, err := strconv.Atoi(match.Elo)
				if err != nil {
					fmt.Printf("Failed to convert string to int: %s\n", err.Error())
				} else {
					startingElo = val
				}
			}
			continue
		}

		if match.TeamID == match.WinnerTeamID {
			wins++
		} else {
			losses++
		}
	}

	if startingElo == 0 {
		startingElo = player.Games.CS2.Elo
	}

	diff := player.Games.CS2.Elo - startingElo

	diffStr := ""
	if diff >= 0 {
		diffStr = fmt.Sprintf("+%v", diff)
	} else {
		diffStr = fmt.Sprintf("%v", diff)
	}

	fmt.Fprintf(w, "LVL: %v, ELO: %v (%s), Matches: %vW/%vL", player.Games.CS2.Level, player.Games.CS2.Elo, diffStr, wins, losses)
}
