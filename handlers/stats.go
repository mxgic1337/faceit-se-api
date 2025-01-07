package handlers

import (
	"faceit-se-api/utils"
	"fmt"
	"net/http"
	"strconv"
	"strings"
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

	format := r.URL.Query().Get("format")
	if format == "" {
		format = "LVL: $lvl, ELO: $elo ($diff), Matches: $winsW/$lossesL"
	}
	format = strings.Replace(format, "$name", player.Username, -1)
	format = strings.Replace(format, "$lvl", strconv.Itoa(player.Games.CS2.Level), -1)
	format = strings.Replace(format, "$elo", strconv.Itoa(player.Games.CS2.Elo), -1)
	format = strings.Replace(format, "$diff", diffStr, -1)
	format = strings.Replace(format, "$wins", strconv.Itoa(wins), -1)
	format = strings.Replace(format, "$losses", strconv.Itoa(losses), -1)

	fmt.Fprintf(w, "%s", format)
}
