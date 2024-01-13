const APICallsUtility = {
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
};

export default APICallsUtility;