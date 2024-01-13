const APIPopupDataUtility = {
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
	
	getAwayTeamId(gameData) {
		return gameData.awayTeam.id;
	},
	
	getHomeTeamId(gameData) {
		return gameData.homeTeam.id;
	},
	
	getAwayTeamAbbrev(gameData) {
		return gameData.awayTeam.abbrev;
	},
	
	getHomeTeamAbbrev(gameData) {
		return gameData.homeTeam.abbrev;
	},
	
	getAwayTeamAbbrevLowerCase(gameData) {
		return gameData.awayTeam.abbrev.toLowerCase();
	},
	
	getHomeTeamAbbrevLowerCase(gameData) {
		return gameData.homeTeam.abbrev.toLowerCase();
	},
	
	getAwayTeamScore(gameData) {
		return gameData.awayTeam.score;
	},
	
	getHomeTeamScore(gameData) {
		return gameData.homeTeam.score;
	},
	
	getAwayTeamName(gameData) {
		return gameData.awayTeam.name.default;
	},
	
	getHomeTeamName(gameData) {
		return gameData.homeTeam.name.default;
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
	},
	
	getCalendarGames(calendarData) {
		return calendarData.games;
	},
	
	getAwayTeamOnIce(gameData) {
		return gameData.awayTeam.onIce;
	},
	
	getHomeTeamOnIce(gameData) {
		return gameData.homeTeam.onIce;
	},
	
	getRosterSpots(gameData) {
		return gameData.rosterSpots;
	},
	
	getOnIcePlayer(rosterSpots, onIcePlayer) {
		return rosterSpots.find(rosterSpot => rosterSpot.playerId === onIcePlayer.playerId);
	},
	
	getPlayerFullName(player) {
		return player.firstName.default + " " + player.lastName.default;
	},
	
	getPlayerFirstName(player) {
		return player.firstName.default;
	},
	
	getPlayerLastName(player) {
		return player.lastName.default;
	},
	
	getPlayerNameArray(player) {
		return player.name.default.split(" ");
	},
	
	getPlayerName(player) {
		return player.name.default;
	},
	
	getPlayerSweaterNumber(player) {
		return player.sweaterNumber;
	},
	
	getPlayerPositionCode(player) {
		return player.positionCode;
	},
	
	getAwayTeam(gameData) {
		return gameData.awayTeam;
	},
	
	getHomeTeam(gameData) {
		return gameData.homeTeam;
	},
	
	getAwayPlayerByGameStats(gameData) {
		return gameData.boxscore.playerByGameStats.awayTeam;
	},
	
	getHomePlayerByGameStats(gameData) {
		return gameData.boxscore.playerByGameStats.homeTeam;
	},
	
	getAwayTeamForwards(awayTeamPlayers) {
		return awayTeamPlayers.forwards;
	},
	
	getAwayTeamDefense(awayTeamPlayers) {
		return awayTeamPlayers.defense;
	},
	
	getAwayTeamGoalies(awayTeamPlayers) {
		return awayTeamPlayers.goalies;
	},
	
	getHomeTeamForwards(homeTeamPlayers) {
		return homeTeamPlayers.forwards;
	},
	
	getHomeTeamDefense(homeTeamPlayers) {
		return homeTeamPlayers.defense;
	},
	
	getHomeTeamGoalies(homeTeamPlayers) {
		return homeTeamPlayers.goalies;
	},
	
	getSkatersStats(playerStats) {
		return playerStats.skaters;
	},
	
	getGoaliesStats(playerStats) {
		return playerStats.goalies;
	},
	
	findForwardByFullName(rosterData, player) {
		return rosterData.forwards.find(forward => forward.lastName.default === player.lastName.default && forward.firstName.default === player.firstName.default);
	},
	
	findDefensemanByFullName(rosterData, player) {
		return rosterData.defensemen.find(defenseman => defenseman.lastName.default === player.lastName.default && defenseman.firstName.default === player.firstName.default);
	},
	
	findGoalieByFullName(rosterData, player) {
		return rosterData.goalies.find(goalie => goalie.lastName.default === player.lastName.default && goalie.firstName.default === player.firstName.default);
	},
	
	getPlayerGamesPlayed(player) {
		return player.gamesPlayed;
	},
	
	getPlayerShots(player) {
		return player.shots;
	},
	
	getPlayerGoals(player) {
		return player.goals;
	},
	
	getPlayerAssists(player) {
		return player.assists;
	},
	
	getPlayerPoints(player) {
		return player.points;
	},
	
	getPlayerPlusMinus(player) {
		return player.plusMinus;
	},
	
	getPlayerPIMs(player) {
		return player.pim;
	},
	
	getPlayerPowerPlayGoals(player) {
		return player.powerPlayGoals;
	},
	
	getPlayerShorthandedGoals(player) {
		return player.shorthandedGoals;
	},
	
	getPlayerGameWinningGoals(player) {
		return player.gameWinningGoals;
	},
	
	getGoalieWins(player) {
		return player.wins;
	},
	
	getGoalieLosses(player) {
		return player.losses;
	},
	
	getGoalieShotsAgainst(player) {
		return player.shotsAgainst;
	},
	
	getGoalieGoalsAgainst(player) {
		return player.goalsAgainst;
	},
	
	getGoalieGoalsAgainstAverage(player) {
		let goalsAgainstAverage = Number(player.goalsAgainstAverage ?? 0);
		return goalsAgainstAverage.toFixed(2) + "%";
	},
	
	getGoalieEvenStrengthShotsAgainst(player) {
		return player.evenStrengthShotsAgainst;
	},
	
	getGoaliePowerPlayShotsAgainst(player) {
		return player.powerPlayShotsAgainst;
	},
	
	getGoalieShorthandedShotsAgainst(player) {
		return player.shorthandedShotsAgainst;
	},
	
	getGoalieSaveShotsAgainst(player) {
		return player.saveShotsAgainst;
	},
	
	getGoalieSavePercentage(player) {
		let savePercentText = Number(player.savePctg ?? 0) * 100;
		return savePercentText.toFixed(2) + "%";
	},
	
	getGoalieNonLiveSavePercentage(player) {
		let savePercentageText = Number(player.savePercentage ?? 0) * 100;
		return savePercentageText.toFixed(2) + "%";
	},
	
	getGoaliePIMs(player) {
		return player.pim;
	},
	
	getGoalieTimeOnIce(player) {
		return player.toi;
	},
	
	getGoalieShutouts(player) {
		return player.shutouts;
	},
	
	getStandingDivisionAbbrev(standing) {
		return standing.divisionAbbrev;
	},
	
	getStandingDivisionName(standing) {
		return standing.divisionName;
	},
	
	getStandingConferenceAbbrev(standing) {
		return standing.conferenceAbbrev;
	},
	
	getStandingConferenceName(standing) {
		return standing.conferenceName;
	},
	
	getTeamWildcardSequence(team) {
		return team.wildcardSequence;
	},
	
	getStandingTeamAbbrev(team) {
		return team.teamAbbrev.default;
	},
	
	getTeamGamesPlayed(team) {
		return team.gamesPlayed;
	},
	
	getTeamWins(team) {
		return team.wins;
	},
	
	getTeamLosses(team) {
		return team.losses;
	},
	
	getTeamOtLosses(team) {
		return team.otLosses;
	},
	
	getTeamPoints(team) {
		return team.points;
	},
	
	getTeamRegulationPlusOtWins(team) {
		return team.regulationPlusOtWins;
	},
	
	getTeamStreakCode(team) {
		return team.streakCode;
	},
	
	getTeamStreakCount(team) {
		return team.streakCount;
	}
};