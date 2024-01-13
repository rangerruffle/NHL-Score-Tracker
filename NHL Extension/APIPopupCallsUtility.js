const APIPopupCallsUtility = {
	fetchTeamSeasonSchedule(teamAbbv, teamName, setScheduleData, setNoGame) {
		fetch("https://api-web.nhle.com/v1/club-schedule-season/" + teamAbbv + "/now")
			.catch(error => {
				setNoGame(teamName);
			})
			.then(response => response.json())
			.then(scheduleInfo => {
				setScheduleData(scheduleInfo);
			});
	},
	
	fetchCurrentGameData(currentGameId, teamName, setGameData, setNoGame) {
		fetch("https://api-web.nhle.com/v1/gamecenter/" + currentGameId + "/boxscore")
			.catch(error => {
				setNoGame(teamName);
			})
			.then(response => response.json())
			.then(gameInfo => {
				setGameData(gameInfo);
			});
	},
	
	fetchCalendarData(teamAbbv, calendarYear, calendarMonth, setCalendarHeader, setCalendarDates) {
		fetch("https://api-web.nhle.com/v1/club-schedule/" + teamAbbv + "/month/" + calendarYear + "-" + calendarMonth)
			.catch(error => {
				return null;
			})
			.then(response => response.json())
			.then(calendarInfo => {
				setCalendarHeader();
				setCalendarDates(calendarInfo);
			});
	},
	
	fetchPlayByPlayData(gameId, setRinkSection) {
		fetch("https://api-web.nhle.com/v1/gamecenter/" + gameId + "/play-by-play")
			.catch(error => {
				console.log(error);
			})
			.then(response => response.json())
			.then(liveData => {
				setRinkSection(liveData);
			});
	},
	
	fetchAwayTeamPlayerStats(awayTeamAbbv, setAwayNonLivePlayerStats) {
		fetch("https://api-web.nhle.com/v1/club-stats/" + awayTeamAbbv + "/now")
			.catch(error => {
				console.log(error);
			})
			.then(response => response.json())
			.then(playerStats => {
				setAwayNonLivePlayerStats(playerStats, awayTeamAbbv);
			});
	},
	
	fetchHomeTeamPlayerStats(homeTeamAbbv, setHomeNonLivePlayerStats) {
		fetch("https://api-web.nhle.com/v1/club-stats/" + homeTeamAbbv + "/now")
			.catch(error => {
				console.log(error);
			})
			.then(response => response.json())
			.then(playerStats => {
				setHomeNonLivePlayerStats(playerStats, homeTeamAbbv);
			});
	},
	
	fetchNonLivePlayerStats(teamAbbv, setNonLivePlayerStats) {
		fetch("https://api-web.nhle.com/v1/club-stats/" + teamAbbv + "/now")
			.catch(error => {
				console.log(error);
			})
			.then(response => response.json())
			.then(playerStats => {
				setNonLivePlayerStats(playerStats);
			});
	},
	
	fetchNonLiveRosterStats(teamAbbv, addPlayerStats, playerStats, defenseElement, forwardsElement, goaliesElement) {
		fetch("https://api-web.nhle.com/v1/roster/" + teamAbbv + "/current")
			.catch(error => {
				console.log(error);
			})
			.then(response => response.json())
			.then(rosterInfo => {
				addPlayerStats(playerStats, rosterInfo, defenseElement, forwardsElement, goaliesElement);
			});
	},
	
	fetchStandings(setStandingsData) {
		fetch("https://api-web.nhle.com/v1/standings/now")
			.catch(error => {
				console.log(error);
			})
			.then(response => response.json())
			.then(standingsInfo => {
				setStandingsData(standingsInfo.standings);
			});
	}
};