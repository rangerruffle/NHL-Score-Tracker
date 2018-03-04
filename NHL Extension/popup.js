const teams = [ "Avalanche", "Blackhawks", "Blue Jackets", "Blues", "Bruins", "Canadiens", "Canucks", "Capitals", "Coyotes", "Devils", "Ducks", "Flames", "Flyers", "Golden Knights", "Hurricanes", "Islanders", "Jets", "Kings", "Lightning", "Maple Leafs", "Oilers", "Panthers", "Penguins", "Predators", "Rangers", "Red Wings", "Sabres", "Senators", "Sharks", "Stars", "Wild" ];
const teamIds = { "Avalanche": 21, "Blackhawks": 16, "Blue Jackets": 29, "Blues": 19, "Bruins": 6, "Canadiens": 8, "Canucks": 23, "Capitals": 15, "Coyotes": 53, "Devils": 1, "Ducks": 24, "Flames": 20, "Flyers": 4, "Golden Knights": 54, "Hurricanes": 12, "Islanders": 2, "Jets": 52, "Kings": 26, "Lightning": 14, "Maple Leafs": 10, "Oilers": 22, "Panthers": 13, "Penguins": 5, "Predators": 18, "Rangers": 3, "Red Wings": 17, "Sabres": 7, "Senators": 9, "Sharks": 28, "Stars": 25, "Wild": 30 };

var awayScore = "0";
var awayTeamIcon = "logos/nhl.png";
var homeScore = "0";
var homeTeamIcon = "logos/nhl.png";
var otherTeamName = "";
var teamName = "";
var teamIcon = "logos/nhl.png";
var teamId = "";
var timeZone = "US/Central";
var todayYear = "";
var todayMonth = "";
var todayDay = "";

// Heading
const headingAwayScore = document.getElementById('awayScore');
const timeLeft = document.getElementById('time');
const headingHomeScore = document.getElementById('homeScore');

// Tabs
const previewTab = document.getElementById('previewTab');
const liveTab = document.getElementById('liveTab');
const teamStatsTab = document.getElementById('teamStatsTab');
const playerStatsTab = document.getElementById('playerStatsTab');
const standingsTab = document.getElementById('standingsTab');

// Sections
const rink = document.getElementById('rink');
const teamStats = document.getElementById('gameTeamStats');
const playerStats = document.getElementById('playerStats');
const standings = document.getElementById('standings');

// Rink
const awayLeftWing = document.getElementById('awayLeftWing');
const awayCenter = document.getElementById('awayCenter');
const awayRightWing = document.getElementById('awayRightWing');
const awayLeftDefense = document.getElementById('awayLeftDefense');
const awayRightDefense = document.getElementById('awayRightDefense');
const awayGoalie = document.getElementById('awayGoalie');
const homeLeftWing = document.getElementById('homeLeftWing');
const homeCenter = document.getElementById('homeCenter');
const homeRightWing = document.getElementById('homeRightWing');
const homeLeftDefense = document.getElementById('homeLeftDefense');
const homeRightDefense = document.getElementById('homeRightDefense');
const homeGoalie = document.getElementById('homeGoalie');

// Team Stats
const teamStatsAwayImage = document.getElementById('teamStatsAwayImage');
const teamStatsAwayTeamName = document.getElementById('teamStatsAwayTeamName');
const teamStatsHomeImage = document.getElementById('teamStatsHomeImage');
const teamStatsHomeTeamName = document.getElementById('teamStatsHomeTeamName');

// Player Stats
const awayStatsButton = document.getElementById('awayStatsButton');
const homeStatsButton = document.getElementById('homeStatsButton');
const awayPlayerStatsTeamName = document.getElementById('awayPlayerStatsTeamName');
const awayTeamForwards = document.getElementById('awayTeamForwards');
const awayTeamDefense = document.getElementById('awayTeamDefense');
const awayTeamGoalies = document.getElementById('awayTeamGoalies');
const homePlayerStatsTeamName = document.getElementById('homePlayerStatsTeamName');
const homeTeamForwards = document.getElementById('homeTeamForwards');
const homeTeamDefense = document.getElementById('homeTeamDefense');
const homeTeamGoalies = document.getElementById('homeTeamGoalies');

// Standings
const divisionStandingsButton = document.getElementById('divisionStandingsButton');
const wildCardStandingsButton = document.getElementById('wildCardStandingsButton');
const conferenceStandingsButton = document.getElementById('conferenceStandingsButton');
const leagueStandingsButton = document.getElementById('leagueStandingsButton');
const divisionStandings = document.getElementById('divisionStandings');
const division = document.getElementById('division');
const divisionTeamStandings = document.getElementById('divisionTeamStandings');
const wildCardStandings = document.getElementById('wildCardStandings');
const wildCardDivision1 = document.getElementById('wildCardDivision1');
const wildCardDivision1TeamStandings = document.getElementById('wildCardDivision1TeamStandings');
const wildCardDivision2 = document.getElementById('wildCardDivision2');
const wildCardDivision2TeamStandings = document.getElementById('wildCardDivision2TeamStandings');
const wildCardTeamStandings = document.getElementById('wildCardTeamStandings');
const conferenceStandings = document.getElementById('conferenceStandings');
const conference = document.getElementById('conference');
const conferenceTeamStandings = document.getElementById('conferenceTeamStandings');
const leagueStandings = document.getElementById('leagueStandings');
const leagueTeamStandings = document.getElementById('leagueTeamStandings');

// Footer
const nhlLink = document.getElementById('nhlLink');

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
			
			if (scheduleInfo.dates[0]) {
				if (scheduleInfo.dates[0].games[0]) {
					currentGameId = scheduleInfo.dates[0].games[0].gamePk;
					gameLiveLink = scheduleInfo.dates[0].games[0].link;
				} else {
					currentGameId = false;
					setNoGame();
				}
			} else {
				currentGameId = false;
				setNoGame();
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
					const gameInfo = JSON.parse(gameXmlHttp.responseText);
					const game = gameInfo.gameData;
					const teamIsHome = game.teams.home.id === teamId;
					const gameToday = currentGameId != false;
					
					if (gameToday) {
						awayScore = gameInfo.liveData.linescore.teams.away.goals;
						homeScore = gameInfo.liveData.linescore.teams.home.goals;
						otherTeamName = teamIsHome ? game.teams.away.teamName : game.teams.home.teamName;
						
						if (teamIsHome) {
							drawAwayLogo("icons/" + otherTeamName + ".png");
							drawHomeLogo(teamIcon);
						} else {
							drawAwayLogo(teamIcon);
							drawHomeLogo("icons/" + otherTeamName + ".png");
						}
						
						if (game.status.abstractGameState == "Preview") {
							setPreview(gameInfo);
							currentlyPreGame = true;
						} else if (game.status.abstractGameState == "Final") {
							setFinal(gameInfo);
							currentlyPreGame = false;
						} else if (game.status.abstractGameState == "Live") {
							setLive(gameInfo);
							currentlyPreGame = false;
						}
					}
				}
			}
		}
		
		drawAwayLogo(awayTeamIcon);
		drawHomeLogo(homeTeamIcon);
	}, 250);
}

function setPreview(gameInfo) {
	show(previewTab);
	hide(liveTab);
	hide(teamStatsTab);
	show(playerStatsTab);
	show(standingsTab);
	
	setPlayerStatsSection(gameInfo, "preview");
	setStandingsSection(gameInfo, "preview");
}

function setLive(gameInfo) {
	hide(previewTab);
	show(liveTab);
	show(teamStatsTab);
	show(playerStatsTab);
	show(standingsTab);
	
	setRinkSection(gameInfo);
	setTeamStatsSection(gameInfo);
	setPlayerStatsSection(gameInfo, "live");
	setStandingsSection(gameInfo, "live");
}

function setFinal(gameInfo) {
	hide(previewTab);
	hide(liveTab);
	show(teamStatsTab);
	show(playerStatsTab);
	show(standingsTab);
	
	timeLeft.innerHTML = 'Final';
	headingAwayScore.innerHTML = awayScore;
	headingHomeScore.innerHTML = homeScore;

	if (gameTimeDataRefreshTimer) {
		window.clearInterval(gameTimeDataRefreshTimer);
		gameTimeDataRefreshTimer = false;
	}
	
	setTeamStatsSection(gameInfo);
	setPlayerStatsSection(gameInfo, "final");
	setStandingsSection(gameInfo, "final");
}

function setNoGame() {
	hide(previewTab);
	hide(liveTab);
	hide(teamStatsTab);
	show(playerStatsTab);
	show(standingsTab);

	timeLeft.innerHTML = 'No Game';
	headingAwayScore.innerHTML = '0';
	headingHomeScore.innerHTML = '0';

	drawAwayLogo(teamIcon);
	drawHomeLogo(teamIcon);
	
	setPlayerStatsSection(gameInfo, "none");
	setStandingsSection(gameInfo, "none");
}

function setRinkSection(gameInfo) {
	var period = gameInfo.liveData.linescore.currentPeriod;
	var isShootout = period === 5;
	switch (period) {
		case 1:
			period = "1st";
			break;
		case 2:
			period = "2nd";
			break;
		case 3:
			period = "3rd";
			break;
		case 4:
			period = "OT";
			break;
		case 5:
			period = "SO";
			break;
	}
	
	if (gameInfo.liveData.linescore.currentPeriodTimeRemaining === "END") {
		headingAwayScore.innerHTML = awayScore;
		headingHomeScore.innerHTML = homeScore;
		timeLeft.innerHTML = "END / " + period;
	} else {
		if (isShootout) {
			headingAwayScore.innerHTML = gameInfo.liveData.linescore.shootoutInfo.away.scores;
			headingHomeScore.innerHTML = gameInfo.liveData.linescore.shootoutInfo.home.scores;
			timeLeft.innerHTML = "SO";
		} else {
			headingAwayScore.innerHTML = awayScore;
			headingHomeScore.innerHTML = homeScore;
			timeLeft.innerHTML = gameInfo.liveData.linescore.currentPeriodTimeRemaining + " / " + period;
		}
	}
	startInGameDataUpdateTimerIfNeeded();
}

function setTeamStatsSection(gameInfo) {
	// Live in-game stats
}

function setPlayerStatsSection(gameInfo, gameStatus) {
	/*
	Example Forward:
	<div class="playerStatsLine">
		<div class="nameNumber">
			<div class="number">40</div>
			<div class="name">Zetterberg</div>
		</div>
		<div class="stats">
			<div class="stat">40</div>
			<div class="stat">40</div>
			<div class="stat">40</div>
			<div class="stat">80</div>
			<div class="stat">80</div>
			<div class="stat">0</div>
			<div class="stat">20</div>
			<div class="stat">20</div>
		</div>
	</div>
	*/
	switch(gameStatus) {
		case "preview":
			// Season stats.
			break;
		case "live":
			// Game stats.
			break;
		case "final":
			// Game stats.
			break;
		case "none":
			// Season stats.
			break;
	}
}

function setStandingsSection(gameInfo) {
	// Division, Wild Card, Conference, and League
	/*
	Example Standing:
	<div class="standingsTeamLine"> Add wildCardCutOff class after the second team line in the wild card section of the wild card tab.
		<div class="standingsTeam">
			<image class="standingsTeamImage" src="logos/nhl.png"></image>
			<div class="standingsTeamName">Team Name</div>
		</div>
		<div class="stats">
			<div class="stat">49</div>
			<div class="stat">18</div>
			<div class="stat">21</div>
			<div class="stat">1,408</div>
			<div class="stat">124</div>
			<div class="stat">2.79</div>
		</div>
	</div>
	*/
}

function drawAwayLogo(icon) {
	const headingAwayImage = document.getElementById('headingAwayImage');
	headingAwayImage.src = icon;
}

function drawHomeLogo(icon) {
	const headingHomeImage = document.getElementById('headingHomeImage');
	headingHomeImage.src = icon;
}

function hideShowElements(elementToShow) {
	if (rink === elementToShow) {
		show(rink);
	} else {
		hide(rink);
	}

	if (teamStats === elementToShow) {
		show(teamStats);
	} else {
		hide(teamStats);
	}

	if (playerStats === elementToShow) {
		show(playerStats);
	} else {
		hide(playerStats);
	}

	if (standings === elementToShow) {
		show(standings);
	} else {
		hide(standings);
	}
}

function addClass(element, className) {
	if (element && !element.classList.contains(className)) {
		element.classList.add(className);
	}
}

function removeClass(element, className) {
	if (element && element.classList.contains(className)) {
		element.classList.remove(className);
	}
}

function hide(element) {
	if (element && !element.classList.contains('hidden')) {
		element.classList.add('hidden');
	}
}

function show(element) {
	if (element && element.classList.contains('hidden')) {
		element.classList.remove('hidden');
	}
}