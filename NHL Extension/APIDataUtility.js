const APIDataUtility = {
	findScheduleGameIndex(scheduleData, todayYear, todayMonth, todayDay) {
		return scheduleData.games.findIndex(game => game.gameDate === todayYear + '-' + todayMonth + '-' + todayDay);
	},
	
	getTodaysGame(scheduleData, gameIndex) {
		return scheduleData.games[gameIndex];
	},
	
	getTodaysGameId(gameData) {
		return gameData.id;
	},
	
	getTodaysGameDateTime(gameData) {
		return gameData.startTimeUTC;
	},
	
	getHomeTeamId(gameData) {
		return gameData.homeTeam.id;
	},
	
	getAwayTeamAbbrev(gameData) {
		return gameData.awayTeam.abbrev.toLowerCase();
	},
	
	getHomeTeamAbbrev(gameData) {
		return gameData.homeTeam.abbrev.toLowerCase();
	},
	
	getAwayTeamScore(gameData) {
		return gameData.awayTeam.score;
	},
	
	getHomeTeamScore(gameData) {
		return gameData.homeTeam.score;
	},
	
	getVenueName(gameData) {
		return gameData.venue.default;
	},
	
	getAwayTeamName(gameData) {
		return gameData.awayTeam.commonName.default;
	},
	
	getHomeTeamName(gameData) {
		return gameData.homeTeam.commonName.default;
	},
	
	getGameState(gameData) {
		return gameData.gameState;
	},
	
	getCurrentPeriod(gameData) {
		return gameData.period;
	},
	
	getCurrentPeriodType(gameData) {
		return gameData.periodDescriptor.periodType;
	},
	
	getIsInIntermission(gameData) {
		return gameData.clock.inIntermission;
	},
	
	getGameTimeRemaining(gameData) {
		return gameData.clock.timeRemaining;
	},
	
	getAwayTeamShootoutGoals(gameData) {
		return gameData.boxscore.linescore.shootout.awayConversions;
	},
	
	getHomeTeamShootoutGoals(gameData) {
		return gameData.boxscore.linescore.shootout.homeConversions;
	}
};

export default APIDataUtility;