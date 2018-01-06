var teams = [ "Avalanche", "Blackhawks", "Blue Jackets", "Blues", "Bruins", "Canadiens", "Canucks", "Capitals", "Coyotes", "Devils", "Ducks", "Flames", "Flyers", "Golden Knights", "Hurricanes", "Islanders", "Jets", "Kings", "Lightning", "Maple Leafs", "Oilers", "Panthers", "Penguins", "Predators", "Rangers", "Red Wings", "Sabres", "Senators", "Sharks", "Stars", "Wild" ];

var teamName = "";
var teamId = "";
var timeZone = "US/Central";
var todayYear = "";
var todayMonth = "";
var todayDay = "";

chrome.storage.sync.get([ 'trackedTeamName','trackedTimeZone' ], function(result) {
	if (result.trackedTeamName) {
		teamName = result.trackedTeamName;
		teamIcon = "logos/" + result.trackedTeamName + ".png";
	}
	
	if (result.trackedTimeZone) {
		timeZone = result.trackedTimeZone;
	}
});

var gameTimeDataRefreshTimer = setInterval(updateData, 1000);

function updateData() {
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth() + 1;
	var yyyy = today.getFullYear();
	
	if (mm < 10) {
		mm = '0' + mm;
	}
	if (dd < 10) {
		dd = '0' + dd;
	}
	
	todayYear = yyyy;
	todayMonth = mm;
	todayDay = dd;
	
	updateGameData(yyyy, mm, dd);
}

function updateGameData(yyyy, mm, dd) {
	teamId = teamIds[teamName];
	var gameLiveLink = "";
	var localGameTime = false;
	var scheduleXmlHttp = new XMLHttpRequest();
	scheduleXmlHttp.open("GET", "https://statsapi.web.nhl.com/api/v1/schedule?startDate=" + todayYear + "-" + todayMonth + "-" + todayDay + "&endDate=" + todayYear + "-" + todayMonth + "-" + todayDay + "&expand=schedule.teams,schedule.game&site=en_nhl&teamId=" + teamId);
	scheduleXmlHttp.send(null);
	scheduleXmlHttp.onreadystatechange = function () {
		if (scheduleXmlHttp.readyState == 4 && scheduleXmlHttp.status == 200) {
			var scheduleInfo = JSON.parse(scheduleXmlHttp.responseText);
			
			// Update the images. Hide the rink and display some text, saying there is no game today while providing a link to NHL.com if there's no game.
			if (scheduleInfo.dates[0]) {
				if (scheduleInfo.dates[0].games[0]) {
					currentGameId = scheduleInfo.dates[0].games[0].gamePk;
					var dateTime = new Date(scheduleInfo.dates[0].games[0].gameDate);
					localGameTime = getTimeZoneAdjustedTime(dateTime);
					gameLiveLink = scheduleInfo.dates[0].games[0].link;
				} else {
					currentGameId = false;
					chrome.browserAction.setTitle({title: "No " + teamName + " game today."});
					chrome.browserAction.setBadgeText({text: ""});
					drawLogo(teamIcon, false);
				}
			} else {
				currentGameId = false;
				chrome.browserAction.setTitle({title: "No " + teamName + " game today."});
				chrome.browserAction.setBadgeText({text: ""});
				drawLogo(teamIcon, false);
			}
		}
	}

	setTimeout(function() {
			if (currentGameId) {
				var gameXmlHttp = new XMLHttpRequest();
				gameXmlHttp.open("GET", "https://statsapi.web.nhl.com/" + gameLiveLink);
				gameXmlHttp.send(null);
				gameXmlHttp.onreadystatechange = function() {
					if (gameXmlHttp.readyState == 4 && gameXmlHttp.status == 200) {
						var gameInfo = JSON.parse(gameXmlHttp.responseText);
						var game = gameInfo.gameData;
						teamIsHome = game.teams.home.id === teamId;
						awayTeamInitial = game.teams.away.abbreviation.toLowerCase();
						homeTeamInitial = game.teams.home.abbreviation.toLowerCase();
						
						var tagText = "No " + teamName + " game today.";
						var badgeText = "";
						var icon = teamIcon;
						var gameToday = currentGameId != false;
						
						if (gameToday) {
							var awayScore = gameInfo.liveData.linescore.teams.away.goals;
							var homeScore = gameInfo.liveData.linescore.teams.home.goals;
							var otherTeamName = "other team";
							var goalie = "";
							var venue = game.teams.home.venue.name;
							otherTeamName = teamIsHome ? game.teams.away.teamName : game.teams.home.teamName;
							
							if (game.status.abstractGameState == "Preview") {
								// Hide the rink and display some preview stats for the game.
								tagText = teamName + " vs " + otherTeamName + " at " + venue + ". Puck drops at " + localGameTime + ".";
								badgeText = localGameTime.substring(0, localGameTime.length - 2);
								currentlyPreGame = true;
							} else if (game.status.abstractGameState == "Final") {
								// Hide the rink and display some stats from the game, including outcome.
								var gameResult;
								var teamScore = teamIsHome ? homeScore : awayScore;
								var otherTeamScore = teamIsHome ? awayScore : homeScore;
								if (otherTeamScore > teamScore) {
									gameResult = "lost to";
									icon = lossIcon;
								} else {
									gameResult = "beat";
									icon = winIcon;
								}
								
								tagText = "The " + teamName + " " + gameResult + " the " + otherTeamName + " " + teamScore + "-" + otherTeamScore + " at " + venue;
								badgeText = awayScore + "-" + homeScore;
								
								if (gameTimeDataRefreshTimer) {
									window.clearInterval(gameTimeDataRefreshTimer);
									gameTimeDataRefreshTimer = false;
								}
								currentlyPreGame = false;
							} else if (game.status.abstractGameState == "Live") {
								// Update data in the rink, scores, and time.
								var scoreStatus;
								var teamScore = teamIsHome ? homeScore : awayScore;
								var otherTeamScore = teamIsHome ? awayScore : homeScore;
								if (teamScore > otherTeamScore) {
									scoreStatus = "leading";
								} else if (teamScore < otherTeamScore) {
									scoreStatus = "trailing"
								} else if (awayScore == homeScore) {
									scoreStatus = "tied with";
								}
								
								var period = gameInfo.liveData.linescore.currentPeriod;
								var isShootout = period === 5;
								switch (period) {
									case 1:
										period = "the 1st period";
										break;
									case 2:
										period = "the 2nd period";
										break;
									case 3:
										period = "the 3rd period";
										break;
									case 4:
										period = "overtime";
										break;
									case 5:
										period = "the shootout";
										break;
								}
								
								if (gameInfo.liveData.linescore.currentPeriodTimeRemaining === "END") {
									tagText = "The " + teamName + " are " + scoreStatus + " the " + otherTeamName + " " + teamScore + "-" + otherTeamScore + " at the end of " + period + ".";
								} else {
									if (isShootout) {
										home = gameInfo.liveData.linescore.shootoutInfo.home.scores;
										away = gameInfo.liveData.linescore.shootoutInfo.away.scores;
										if (teamIsHome) {
											teamScore = home;
											otherTeamScore = away;
										} else {
											teamScore = away;
											otherTeamScore = home;
										}
										tagText = "The " + teamName + " are " + scoreStatus + " the " + otherTeamName + " " + teamScore + "-" + otherTeamScore + " in " + period;
									} else {
										tagText = "The " + teamName + " are " + scoreStatus + " the " + otherTeamName + " " + teamScore + "-" + otherTeamScore + " in " + period + " with " + gameInfo.liveData.linescore.currentPeriodTimeRemaining + " remaining";
									}
								}
								
								badgeText = awayScore + "-" + homeScore;
								startInGameDataUpdateTimerIfNeeded();
								currentlyPreGame = false;
							} else {
								badgeText = "TBD";
								tagText = "The status of the game could not be determined at this time. Please try reselecting your team. If that does not work, please notify the developer or look at NHL.com as their servers may be down.";
							}
						}
						
						if (tagText) {
							chrome.browserAction.setTitle({title: tagText});
						}
						if (badgeText !== false) {
							chrome.browserAction.setBadgeBackgroundColor({ color: [0, 0, 0, 255] });
							chrome.browserAction.setBadgeText({text: badgeText});
						}
						drawLogo(icon, gameToday);
					}
				}
			}
		},
		250
	);
}