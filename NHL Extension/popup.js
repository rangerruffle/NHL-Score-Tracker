const teams = [ "Avalanche", "Blackhawks", "Blue Jackets", "Blues", "Bruins", "Canadiens", "Canucks", "Capitals", "Coyotes", "Devils", "Ducks", "Flames", "Flyers", "Golden Knights", "Hurricanes", "Islanders", "Jets", "Kings", "Lightning", "Maple Leafs", "Oilers", "Panthers", "Penguins", "Predators", "Rangers", "Red Wings", "Sabres", "Senators", "Sharks", "Stars", "Wild" ];
const teamIds = { "Avalanche": 21, "Blackhawks": 16, "Blue Jackets": 29, "Blues": 19, "Bruins": 6, "Canadiens": 8, "Canucks": 23, "Capitals": 15, "Coyotes": 53, "Devils": 1, "Ducks": 24, "Flames": 20, "Flyers": 4, "Golden Knights": 54, "Hurricanes": 12, "Islanders": 2, "Jets": 52, "Kings": 26, "Lightning": 14, "Maple Leafs": 10, "Oilers": 22, "Panthers": 13, "Penguins": 5, "Predators": 18, "Rangers": 3, "Red Wings": 17, "Sabres": 7, "Senators": 9, "Sharks": 28, "Stars": 25, "Wild": 30 };

var awayScore = "0";
var awayTeamIcon = "logos/nhl.png";
var awayTeamName = "";
var awayTeamOnIce = [];
var awayTeamDefense = [];
var homeScore = "0";
var homeTeamIcon = "logos/nhl.png";
var homeTeamName = "";
var homeTeamOnIce = [];
var homeTeamDefense = [];
var otherTeamName = "";
var teamName = "";
var teamIcon = "logos/nhl.png";
var teamId = "";
var timeZone = "US/Central";
var todayYear = "";
var todayMonth = "";
var todayDay = "";

// Heading
const headingAwayScore = document.getElementById("awayScore");
const timeLeft = document.getElementById("time");
const headingHomeScore = document.getElementById("homeScore");

// Tabs
const previewTab = document.getElementById("previewTab");
const liveTab = document.getElementById("liveTab");
const teamStatsTab = document.getElementById("teamStatsTab");
const playerStatsTab = document.getElementById("playerStatsTab");
const standingsTab = document.getElementById("standingsTab");

// Sections
const rink = document.getElementById("rink");
const teamStats = document.getElementById("gameTeamStats");
const playerStats = document.getElementById("playerStats");
const standings = document.getElementById("standings");

// Footer
const nhlLink = document.getElementById("nhlLink");

chrome.storage.sync.get([ "trackedTeamName","trackedTimeZone" ], function(result) {
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
		mm = "0" + mm;
	}
	if (dd < 10) {
		dd = "0" + dd;
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
							awayTeamIcon = "icons/" + otherTeamName + ".png";
							homeTeamIcon = teamIcon;

							awayTeamName = otherTeamName;
							homeTeamName = teamName;

							drawAwayLogo("icons/" + otherTeamName + ".png");
							drawHomeLogo(teamIcon);
						} else {
							awayTeamIcon = teamIcon;
							homeTeamIcon = "icons/" + otherTeamName + ".png";

							awayTeamName = teamName;
							homeTeamName = otherTeamName;

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
	
	setHeadingSection(gameInfo, "live");
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
	
	setHeadingSection(gameInfo, "none");
	setPlayerStatsSection(gameInfo, "none");
	setStandingsSection(gameInfo, "none");
}

function setHeadingSection(gameInfo, gameStatus) {
	switch(gameStatus) {
		case "preview":
			timeLeft.innerHTML = "20:00";
			headingAwayScore.innerHTML = "0";
			headingHomeScore.innerHTML = "0";
			break;
		case "live":
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
			break;
		case "final":
			timeLeft.innerHTML = "Final";
			headingAwayScore.innerHTML = awayScore;
			headingHomeScore.innerHTML = homeScore;
			break;
		case "none":
			drawAwayLogo(teamIcon);
			drawHomeLogo(teamIcon);
			timeLeft.innerHTML = "No Game";
			headingAwayScore.innerHTML = "0";
			headingHomeScore.innerHTML = "0";
			break;
	}
}

function setRinkSection(gameInfo) {
	const awayLeftWing = document.getElementById("awayLeftWing");
	const awayCenter = document.getElementById("awayCenter");
	const awayRightWing = document.getElementById("awayRightWing");
	const awayLeftDefense = document.getElementById("awayLeftDefense");
	const awayRightDefense = document.getElementById("awayRightDefense");
	const awayGoalie = document.getElementById("awayGoalie");
	const homeLeftWing = document.getElementById("homeLeftWing");
	const homeCenter = document.getElementById("homeCenter");
	const homeRightWing = document.getElementById("homeRightWing");
	const homeLeftDefense = document.getElementById("homeLeftDefense");
	const homeRightDefense = document.getElementById("homeRightDefense");
	const homeGoalie = document.getElementById("homeGoalie");

	// Live rink stats
	const awayTeamSkaters = gameInfo.liveData.boxscore.teams.away.skaters;
	const awayOnIce = gameInfo.liveData.boxscore.teams.away.onIce;
	const homeTeamSkaters = gameInfo.liveData.boxscore.teams.home.skaters;
	const homeOnIce = gameInfo.liveData.boxscore.teams.home.onIce;
	
	if(awayTeamOnIce !== awayOnIce) {		
		const awayTeamPlayers = gameInfo.liveData.boxscore.teams.away.players;
		for(var i = 0; i < awayOnIce.length; i++) {
			const player = awayTeamPlayers[ID + awayOnIce[i]];
			
			switch(player.position.abbreviation) {
				case "RW":
					if (awayRightWing.innerHTML !== player.jerseyNumber) {
						awayRightWing.innerHTML = player.jerseyNumber;
					}
					break;
				case "C":
					if (awayCenter.innerHTML !== player.jerseyNumber) {
						awayCenter.innerHTML = player.jerseyNumber;
					}
					break;
				case "LW":
					if (awayLeftWing.innerHTML !== player.jerseyNumber) {
						awayLeftWing.innerHTML = player.jerseyNumber;
					}
					break;
				case "D":
					if(awayTeamDefense.length === 0) {
						awayTeamDefense.push(awayOnIce[i]);
						awayLeftDefense.innerHTML = player.jerseyNumber;
					} else if (awayTeamDefense.length === 1) {
						awayTeamDefense.push(awayOnIce[i]);
						awayRightDefense.innerHTML = player.jerseyNumber;
					} else {
						if (!awayOnIce.includes(awayTeamDefense[0]) {
							awayTeamDefense = [awayOnIce[i], awayTeamDefense[1]];
							awayLeftDefense.innerHTML = player.jerseyNumber;
						} else if (!awayOnIce.includes(awayTeamDefense[1]) {
							awayTeamDefense = [awayTeamDefense[0], awayOnIce[i]];
							awayRightDefense.innerHTML = player.jerseyNumber;
						}
					}
					break;
				case "G":
					if (awayGoalie.innerHTML !== player.jerseyNumber) {
						awayGoalie.innerHTML = player.jerseyNumber;
					}
					break;
			}
		}
		
		awayTeamOnIce = awayOnIce;
	}
	
	if(homeTeamOnIce !== homeOnIce) {
		const homeTeamPlayers = gameInfo.liveData.boxscore.teams.home.players;
		for(var i = 0; i < homeOnIce.length; i++) {
			const player = homeTeamPlayers[ID + homeOnIce[i]];
			
			switch(player.position.abbreviation) {
				case "RW":
					if (homeRightWing.innerHTML !== player.jerseyNumber) {
						homeRightWing.innerHTML = player.jerseyNumber;
					}
					break;
				case "C":
					if (homeCenter.innerHTML !== player.jerseyNumber) {
						homeCenter.innerHTML = player.jerseyNumber;
					}
					break;
				case "LW":
					if (homeLeftWing.innerHTML !== player.jerseyNumber) {
						homeLeftWing.innerHTML = player.jerseyNumber;
					}
					break;
				case "D":
					if(homeTeamDefense.length === 0) {
						homeTeamDefense.push(homeOnIce[i]);
						homeLeftDefense.innerHTML = player.jerseyNumber;
					} else if (homeTeamDefense.length === 1) {
						homeTeamDefense.push(homeOnIce[i]);
						homeRightDefense.innerHTML = player.jerseyNumber;
					} else {
						if (!homeOnIce.includes(homeTeamDefense[0]) {
							homeTeamDefense = [homeOnIce[i], homeTeamDefense[1]];
							homeLeftDefense.innerHTML = player.jerseyNumber;
						} else if (!homeOnIce.includes(homeTeamDefense[1]) {
							homeTeamDefense = [homeTeamDefense[0], homeOnIce[i]];
							homeRightDefense.innerHTML = player.jerseyNumber;
						}
					}
					break;
				case "G":
					if (homeGoalie.innerHTML !== player.jerseyNumber) {
						homeGoalie.innerHTML = player.jerseyNumber;
					}
					break;
			}
		}
		
		homeTeamOnIce = homeOnIce;
	}
}

function setTeamStatsSection(gameInfo) {
	// Teams
	const teamStatsAwayImage = document.getElementById("teamStatsAwayImage");
	const teamStatsAwayTeamName = document.getElementById("teamStatsAwayTeamName");
	const teamStatsHomeImage = document.getElementById("teamStatsHomeImage");
	const teamStatsHomeTeamName = document.getElementById("teamStatsHomeTeamName");
	
	// Away Team
	const awayTeamSOG = document.getElementById("awayTeamSOG");
	const awayTeamFO = document.getElementById("awayTeamFO");
	const awayTeamPPG = document.getElementById("awayTeamPPG");
	const awayTeamPIM = document.getElementById("awayTeamPIM");
	const awayTeamHITS = document.getElementById("awayTeamHITS");
	const awayTeamBLKS = document.getElementById("awayTeamBLKS");
	const awayTeamGVA = document.getElementById("awayTeamGVA");
	
	// Home Team
	const homeTeamSOG = document.getElementById("homeTeamSOG");
	const homeTeamFO = document.getElementById("homeTeamFO");
	const homeTeamPPG = document.getElementById("homeTeamPPG");
	const homeTeamPIM = document.getElementById("homeTeamPIM");
	const homeTeamHITS = document.getElementById("homeTeamHITS");
	const homeTeamBLKS = document.getElementById("homeTeamBLKS");
	const homeTeamGVA = document.getElementById("homeTeamGVA");
	
	// Live in-game stats
	teamStatsAwayImage.src = awayTeamIcon;
	teamStatsHomeImage.src = homeTeamIcon;
	teamStatsAwayTeamName.innerHTML = awayTeamName;
	teamStatsHomeTeamName.innerHTML = homeTeamName;

	const awayTeamStats = gameInfo.liveData.boxscore.teams.away.teamStats.teamSkaterStats;
	awayTeamSOG.innerHTML = awayTeamStats.shots;
	awayTeamFO.innerHTML = awayTeamStats.faceOffWinPercentage;
	awayTeamPPG.innerHTML = awayTeamStats.powerPlayGoals;
	awayTeamPIM.innerHTML = awayTeamStats.pim;
	awayTeamHITS.innerHTML = awayTeamStats.hits;
	awayTeamBLKS.innerHTML = awayTeamStats.blocked;
	awayTeamGVA.innerHTML = awayTeamStats.giveaways;
	
	const homeTeamStats = gameInfo.liveData.boxscore.teams.home.teamStats.teamSkaterStats;
	homeTeamSOG.innerHTML = homeTeamStats.shots;
	homeTeamFO.innerHTML = homeTeamStats.faceOffWinPercentage;
	homeTeamPPG.innerHTML = homeTeamStats.powerPlayGoals;
	homeTeamPIM.innerHTML = homeTeamStats.pim;
	homeTeamHITS.innerHTML = homeTeamStats.hits;
	homeTeamBLKS.innerHTML = homeTeamStats.blocked;
	homeTeamGVA.innerHTML = homeTeamStats.giveaways;
}

function setPlayerStatsSection(gameInfo, gameStatus) {
	const awayStatsButton = document.getElementById("awayStatsButton");
	const homeStatsButton = document.getElementById("homeStatsButton");

	const awayPlayerStatsTeamName = document.getElementById("awayPlayerStatsTeamName");
	const homePlayerStatsTeamName = document.getElementById("homePlayerStatsTeamName");
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
	
	if (gameStatus === "preview") {
		const inGamePlayerStats = document.getElementById("inGamePlayerStats");
		const awayTeamForwards = inGamePlayerStats.getElementById("awayTeamForwards");
		const awayTeamDefense = inGamePlayerStats.getElementById("awayTeamDefense");
		const awayTeamGoalies = inGamePlayerStats.getElementById("awayTeamGoalies");

		const homeTeamForwards = inGamePlayerStats.getElementById("homeTeamForwards");
		const homeTeamDefense = inGamePlayerStats.getElementById("homeTeamDefense");
		const homeTeamGoalies = inGamePlayerStats.getElementById("homeTeamGoalies");
		
		const awayTeamPlayers = gameInfo.liveData.boxscore.teams.away.players;
		const homeTeamPlayers = gameInfo.liveData.boxscore.teams.home.players;

		for(var i = 0; i < awayTeamPlayers.length; i++) {
			const player = awayTeamPlayers[i];
			switch(/*player position*/) {
				case "D":
					addPlayerStat(player, awayTeamDefense);
					break;
				case "F":
					addPlayerStat(player, awayTeamForwards);
					break;
				case "G":
					addPlayerStat(player, awayTeamGoalies);
					break;
			}
		}
		
		for(var i = 0; i < homeTeamPlayers.length; i++) {
			const player = homeTeamPlayers[i];
			switch(/*player position*/) {
				case "D":
					addPlayerStat(player, homeTeamDefense);
					break;
				case "F":
					addPlayerStat(player, homeTeamForwards);
					break;
				case "G":
					addPlayerStat(player, homeTeamGoalies);
					break;
			}
		}
	} else if (gameStatus === "live" || gameStatus === "final") {
		const inGamePlayerStats = document.getElementById("inGamePlayerStats");
		const awayTeamForwards = inGamePlayerStats.getElementById("awayTeamForwards");
		const awayTeamDefense = inGamePlayerStats.getElementById("awayTeamDefense");
		const awayTeamGoalies = inGamePlayerStats.getElementById("awayTeamGoalies");

		const homeTeamForwards = inGamePlayerStats.getElementById("homeTeamForwards");
		const homeTeamDefense = inGamePlayerStats.getElementById("homeTeamDefense");
		const homeTeamGoalies = inGamePlayerStats.getElementById("homeTeamGoalies");
		
		const awayTeamPlayers = gameInfo.liveData.boxscore.teams.away.players;
		const homeTeamPlayers = gameInfo.liveData.boxscore.teams.home.players;

		for(var i = 0; i < awayTeamPlayers.length; i++) {
			const player = awayTeamPlayers[i];
			switch(/*player position*/) {
				case "D":
					addInGamePlayerStat(player, awayTeamDefense);
					break;
				case "F":
					addInGamePlayerStat(player, awayTeamForwards);
					break;
				case "G":
					addInGamePlayerStat(player, awayTeamGoalies);
					break;
			}
		}
		
		for(var i = 0; i < homeTeamPlayers.length; i++) {
			const player = homeTeamPlayers[i];
			switch(/*player position*/) {
				case "D":
					addInGamePlayerStat(player, homeTeamDefense);
					break;
				case "F":
					addInGamePlayerStat(player, homeTeamForwards);
					break;
				case "G":
					addInGamePlayerStat(player, homeTeamGoalies);
					break;
			}
		}
	} else {
		const noGamePlayerStats = document.getElementById("noGamePlayerStats");
		const teamForwards = noGamePlayerStats.getElementById("teamForwards");
		const teamDefense = noGamePlayerStats.getElementById("teamDefense");
		const teamGoalies = noGamePlayerStats.getElementById("teamGoalies");
		// Figure out how to get info for this.
		const teamPlayers = ?;
		for(var i = 0; i < teamPlayers.length; i++) {
			const player = teamPlayers[i];
			switch(/*player position*/) {
				case "D":
					addPlayerStat(player, awayTeamDefense);
					break;
				case "F":
					addPlayerStat(player, awayTeamForwards);
					break;
				case "G":
					addPlayerStat(player, awayTeamGoalies);
					break;
			}
		}
	}
}

function setStandingsSection(gameInfo) {
	const divisionStandingsButton = document.getElementById("divisionStandingsButton");
	const wildCardStandingsButton = document.getElementById("wildCardStandingsButton");
	const conferenceStandingsButton = document.getElementById("conferenceStandingsButton");
	const leagueStandingsButton = document.getElementById("leagueStandingsButton");
	const divisionStandings = document.getElementById("divisionStandings");
	const division = document.getElementById("division");
	const divisionTeamStandings = document.getElementById("divisionTeamStandings");
	const wildCardStandings = document.getElementById("wildCardStandings");
	const wildCardDivision1 = document.getElementById("wildCardDivision1");
	const wildCardDivision1TeamStandings = document.getElementById("wildCardDivision1TeamStandings");
	const wildCardDivision2 = document.getElementById("wildCardDivision2");
	const wildCardDivision2TeamStandings = document.getElementById("wildCardDivision2TeamStandings");
	const wildCardTeamStandings = document.getElementById("wildCardTeamStandings");
	const conferenceStandings = document.getElementById("conferenceStandings");
	const conference = document.getElementById("conference");
	const conferenceTeamStandings = document.getElementById("conferenceTeamStandings");
	const leagueStandings = document.getElementById("leagueStandings");
	const leagueTeamStandings = document.getElementById("leagueTeamStandings");
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

function setFooterLinkHref(gameStatus) {
	switch(gameStatus) {
		case "preview":
			nhlLink.setAttribute("href", "http://www.nhl.com/gamecenter/" + awayTeamInitial + "-vs-" + homeTeamInitial + "/" + todayYear + "/" + todayMonth + "/" + todayDay + "/" + currentGameId + "#game=" + currentGameId + ",game_state=preview");
			break;
		case "live":
			nhlLink.setAttribute("href", "http://www.nhl.com/gamecenter/" + awayTeamInitial + "-vs-" + homeTeamInitial + "/" + todayYear + "/" + todayMonth + "/" + todayDay + "/" + currentGameId + "#game=" + currentGameId + ",game_state=live,game_tab=live");
			break;
		case "final":
			nhlLink.setAttribute("href", "http://www.nhl.com/gamecenter/" + awayTeamInitial + "-vs-" + homeTeamInitial + "/" + todayYear + "/" + todayMonth + "/" + todayDay + "/" + currentGameId + "#game=" + currentGameId + ",game_state=live,game_tab=live");
			break;
		case "none":
			nhlLink.setAttribute("href", "https://www.nhl.com/scores");
			break;
	}
}

function addInGamePlayerStat(player, element) {	
	const playerName = player.person.fullName.split(" ");
	const statLine = document.createElement("div");
	statLine.addClass("playerStatsLine");
	const nameNumber = document.createElement("div").addClass("nameNumber");
	const number = document.createElement("div").addClass("number");
	const name = document.createElement("div").addClass("name");
	nameNumber.appendChild(number.appendChild(document.createTextNode(player.jerseyNumber)));
	nameNumber.appendChild(name.appendChild(document.createTextNode(playerName[playerName.length - 1])));
	statLine.appendChild(nameNumber);
	const stats = document.createElement("div").addClass("stats");
	if (player.stats) {
		if (!isGoalie) {
			const shots = document.createElement("div").addClass("stat");
			shots.innerHTML = player.stats.skaterStats.shots;
			stats.appendChild(shots);
			const goals = document.createElement("div").addClass("stat");
			goals.innerHTML = player.stats.skaterStats.goals;
			stats.appendChild(goals);
			const assists = document.createElement("div").addClass("stat");
			assists.innerHTML = player.stats.skaterStats.assists;
			stats.appendChild(assists);
			const points = document.createElement("div").addClass("stat");
			points.innerHTML = player.stats.skaterStats.assists + player.stats.skaterStats.goals;
			stats.appendChild(points);
			const plusMinus = document.createElement("div").addClass("stat");
			plusMinus.innerHTML = player.stats.skaterStats.plusMinus;
			stats.appendChild(plusMinus);
			const penaltyMinutes = document.createElement("div").addClass("stat");
			penaltyMinutes.innerHTML = player.stats.skaterStats.penaltyMinutes;
			stats.appendChild(penaltyMinutes);
			const powerPlay = document.createElement("div").addClass("stat");
			powerPlay.innerHTML = player.stats.skaterStats.powerPlayGoals;
			stats.appendChild(powerPlay);
			const shortHanded = document.createElement("div").addClass("stat");
			shortHanded.innerHTML = player.stats.skaterStats.shortHandedGoals;
			stats.appendChild(shortHanded);
		} else {
			const evenShotsAgainst = document.createElement("div").addClass("stat");
			evenShotsAgainst.innerHTML = player.stats.goalieStats.evenShotsAgainst;
			stats.appendChild(evenShotsAgainst);
			const powerPlayShotsAgainst = document.createElement("div").addClass("stat");
			powerPlayShotsAgainst.innerHTML = player.stats.goalieStats.powerPlayShotsAgainst;
			stats.appendChild(powerPlayShotsAgainst);
			const shortHandedShotsAgainst = document.createElement("div").addClass("stat");
			shortHandedShotsAgainst.innerHTML = player.stats.goalieStats.shortHandedShotsAgainst;
			stats.appendChild(shortHandedShotsAgainst);
			const savesShotsAgainst = document.createElement("div").addClass("stat");
			savesShotsAgainst.innerHTML = player.stats.goalieStats.savePercentage + "%-" + player.stats.goalieStats.shots;
			stats.appendChild(savesShotsAgainst);
			const savePercent = document.createElement("div").addClass("stat");
			savePercent.innerHTML = player.stats.goalieStats.savePercentage + "%";
			stats.appendChild(savePercent);
			const penaltyMinutes = document.createElement("div").addClass("stat");
			penaltyMinutes.innerHTML = player.stats.goalieStats.pim;
			stats.appendChild(penaltyMinutes);
			const timeOnIce = document.createElement("div").addClass("stat");
			timeOnIce.innerHTML = player.stats.goalieStats.timeOnIce;
			stats.appendChild(timeOnIce);
		}
	}
	element.appendChild(stats);
}

function addPlayerStat(player, element, isGoalie) {
	const playerName = player.person.fullName.split(" ");
	if (!isGoalie) {
		element.appendChild(
			<div class="playerStatsLine">
				<div class="nameNumber">
					<div class="number">player.jerseyNumber</div>
					<div class="name">playerName[playerName.length - 1]</div>
				</div>
				<div class="stats">
					<div class="stat">GP</div>
					<div class="stat">G</div>
					<div class="stat">A</div>
					<div class="stat">P</div>
					<div class="stat">+/-</div>
					<div class="stat">PIM</div>
					<div class="stat">PP</div>
					<div class="stat">GW</div>
				</div>
			</div>
		);
	} else {
		element.appendChild(
			<div class="playerStatsLine">
				<div class="nameNumber">
					<div class="number">player.jerseyNumber</div>
					<div class="name">playerName[playerName.length - 1]</div>
				</div>
				<div class="stats">
					<div class="stat">GP</div>
					<div class="stat">W</div>
					<div class="stat">L</div>
					<div class="stat">SA</div>
					<div class="stat">GA</div>
					<div class="stat">GAA</div>
					<div class="stat">SV%</div>
					<div class="stat">SO</div>
				</div>
			</div>
		);
	}
}

function drawAwayLogo(icon) {
	const headingAwayImage = document.getElementById("headingAwayImage");
	headingAwayImage.src = icon;
}

function drawHomeLogo(icon) {
	const headingHomeImage = document.getElementById("headingHomeImage");
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
	if (element && !element.classList.contains("hidden")) {
		element.classList.add("hidden");
	}
}

function show(element) {
	if (element && element.classList.contains("hidden")) {
		element.classList.remove("hidden");
	}
}