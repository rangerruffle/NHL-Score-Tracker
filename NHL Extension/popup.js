var teams = [ "Avalanche", "Blackhawks", "Blue Jackets", "Blues", "Bruins", "Canadiens", "Canucks", "Capitals", "Coyotes", "Devils", "Ducks", "Flames", "Flyers", "Golden Knights", "Hurricanes", "Islanders", "Jets", "Kings", "Lightning", "Maple Leafs", "Oilers", "Panthers", "Penguins", "Predators", "Rangers", "Red Wings", "Sabres", "Senators", "Sharks", "Stars", "Wild" ];
var teamIds = { "Avalanche": 21, "Blackhawks": 16, "Blue Jackets": 29, "Blues": 19, "Bruins": 6, "Canadiens": 8, "Canucks": 23, "Capitals": 15, "Coyotes": 53, "Devils": 1, "Ducks": 24, "Flames": 20, "Flyers": 4, "Golden Knights": 54, "Hurricanes": 12, "Islanders": 2, "Jets": 52, "Kings": 26, "Lightning": 14, "Maple Leafs": 10, "Oilers": 22, "Panthers": 13, "Penguins": 5, "Predators": 18, "Rangers": 3, "Red Wings": 17, "Sabres": 7, "Senators": 9, "Sharks": 28, "Stars": 25, "Wild": 30 };

var awayTeamIcon = "logos/nhl.png";
var homeTeamIcon = "logos/nhl.png";
var teamName = "";
var teamIcon = "logos/nhl.png";
var teamId = "";
var timeZone = "US/Central";
var todayYear = "";
var todayMonth = "";
var todayDay = "";

const rink = document.getElementById('rink');
const preview = document.getElementById('preview');
const gameFinal = document.getElementById('gameFinal');
const standings = document.getElementById('standings');

chrome.storage.sync.get([ 'trackedTeamName','trackedTimeZone' ], function(result) {
	if (result.trackedTeamName) {
		teamName = result.trackedTeamName;
		teamIcon = "logos/" + result.trackedTeamName + ".png";
		teamId = teamIds[teamName];
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
					gameLiveLink = scheduleInfo.dates[0].games[0].link;
					hideShowElements(rink);
				} else {
					currentGameId = false;
					drawAwayLogo("logos/nhl.png", false);
					drawHomeLogo("logos/nhl.png", false);
					hideShowElements(standings);
				}
			} else {
				currentGameId = false;
				drawAwayLogo("logos/nhl.png", false);
				drawHomeLogo("logos/nhl.png", false);
				hideShowElements(standings);
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
					var teamIsHome = game.teams.home.id === teamId;
					awayTeamInitial = game.teams.away.abbreviation.toLowerCase();
					homeTeamInitial = game.teams.home.abbreviation.toLowerCase();
					var gameToday = currentGameId != false;
					
					if (gameToday) {
						const awayScoreElement = document.getElementById('awayScore');
						const timeLeftElement = document.getElementById('time');
						const homeScoreElement = document.getElementById('homeScore');

						var awayScore = gameInfo.liveData.linescore.teams.away.goals;
						var homeScore = gameInfo.liveData.linescore.teams.home.goals;
						var otherTeamName = "other team";
						var venue = game.teams.home.venue.name;
						otherTeamName = teamIsHome ? game.teams.away.teamName : game.teams.home.teamName;
						
						if (game.status.abstractGameState == "Preview") {
							// Hide the rink and display some preview stats for the game.
							hideShowElements(preview);
							currentlyPreGame = true;
						} else if (game.status.abstractGameState == "Final") {
							// Hide the rink and display some stats from the game, including outcome.
							hideShowElements(gameFinal);
							if (gameTimeDataRefreshTimer) {
								window.clearInterval(gameTimeDataRefreshTimer);
								gameTimeDataRefreshTimer = false;
							}
							currentlyPreGame = false;
						} else if (game.status.abstractGameState == "Live") {
							// Update data in the rink, scores, and time.
							hideShowElements(rink);
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
								// Time equals END, hide rink, and show final layout with the stats from the period that just ended.
								hideShowElements(gameFinal);
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
							startInGameDataUpdateTimerIfNeeded();
							currentlyPreGame = false;
						} else {
							hideShowElements(standings);
						}
					}
				}
			}
		}
		
		drawAwayLogo(awayTeamIcon);
		drawHomeLogo(homeTeamIcon);
	}, 250);
}

function drawAwayLogo(icon) {
	const awayLogo = document.getElementById('awayImage');
	awayLogo.src = icon;
}

function drawHomeLogo(icon) {
	const homeLogo = document.getElementById('homeImage');
	homeLogo.src = icon;
}

function hideShowElements(elementToShow) {
	if (rink === elementToShow && !elementToShow.classList.contains('hidden')) {
		rink.classList.add('hidden');
	} else {
		rink.classList.remove('hidden');
	}

	if (preview === elementToShow && !elementToShow.classList.contains('hidden')) {
		preview.classList.add('hidden');
	} else {
		preview.classList.remove('hidden');
	}

	if (gameFinal === elementToShow && !elementToShow.classList.contains('hidden')) {
		gameFinal.classList.add('hidden');
	} else {
		gameFinal.classList.remove('hidden');
	}

	if (standings === elementToShow && !elementToShow.classList.contains('hidden')) {
		standings.classList.add('hidden');
	} else {
		standings.classList.remove('hidden');
	}
}