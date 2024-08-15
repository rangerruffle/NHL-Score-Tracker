var awayScore = "0";
var awayTeamIcon = "logos/nhl.png";
var awayTeamId = 0;
var awayTeamInitial = "";
var awayTeamName = "";
var awayTeamOffense = [];
var awayTeamOnIce = [];
var awayTeamDefense = [];
var currentGameId = false;
var firstOpen = true;
var firstStatsSet = true;
var gameStatus = "None";
var gameTimeDataRefreshTimer = false;
var homeScore = "0";
var homeTeamIcon = "logos/nhl.png";
var homeTeamId = 0;
var homeTeamInitial = "";
var homeTeamName = "";
var homeTeamOffense = [];
var homeTeamOnIce = [];
var homeTeamDefense = [];
var otherTeamName = "";
var teamData = null;
var teamIcon = "";
var teamId = "";
var teamAbbv = "";
var teamName = "";
var today = new Date();
var todayMonth = today.getMonth() + 1;
if (todayMonth < 10) {
	todayMonth = '0' + todayMonth;
}
var todayDay = today.getDate();
if (todayDay < 10) {
	todayDay = '0' + todayDay;
}
var todayYear = today.getFullYear();

// Tabs
var calendarTab;
var previewTab;
var liveTab;
var teamStatsTab;
var playerStatsTab;
var standingsTab;
var activeTab;

// Sections
var calendar;
var rink;
var teamStats;
var inGamePlayerStats;
var playerStats;
var noGamePlayerStats;
var standings;

let commonUtilities = CommonPopupUtilities.init();
chrome.storage.sync.get([ 'trackedTeamName','trackedTimeZone','shouldShowTeamColor' ], function(result) {
	if (!commonUtilities.getTeamAbbv()) {
		commonUtilities = CommonPopupUtilities.init();
	}
	
	teamName = commonUtilities.getTeamName();
	teamAbbv = commonUtilities.getTeamAbbv();
	teamId = commonUtilities.getTeamId();
	teamIcon = "logos/" + teamName + ".png";
	
	if (result.shouldShowTeamColor) {
		addClass(document.body, commonUtilities.getTeamColorClass());
	} else {
		removeClass(document.body, commonUtilities.getTeamColorClass());
	}
});

chrome.alarms.create(
	"NHLScoreTrackerPopup",
	{
		when: Date.now(),
		periodInMinutes: 60
	}
);

chrome.alarms.onAlarm.addListener(function(alarm) {
	if (alarm.name = "NHLScoreTrackerPopup") {
		if (!commonUtilities.getTeamAbbv()) {
			commonUtilities = CommonPopupUtilities.init();
		}
		
		commonUtilities.updateData();

		updateGameData();
	}
});

function updateGameData() {
	calendarTab = document.getElementById("calendarTab");
	previewTab = document.getElementById("previewTab");
	liveTab = document.getElementById("liveTab");
	teamStatsTab = document.getElementById("teamStatsTab");
	playerStatsTab = document.getElementById("playerStatsTab");
	standingsTab = document.getElementById("standingsTab");
	
	calendar = document.getElementById("calendar");
	rink = document.getElementById("rink");
	teamStats = document.getElementById("gameTeamStats");
	inGamePlayerStats = document.getElementById("inGamePlayerStats");
	playerStats = document.getElementById("playerStats");
	noGamePlayerStats = document.getElementById("noGamePlayerStats");
	standings = document.getElementById("standings");
	
	nhlLink = document.getElementById("nhlLink");
	
	setTabListeners();
	setCalendarButtonListeners();
	setCalendar();
	
	teamName = commonUtilities.getTeamName();
	teamAbbv = commonUtilities.getTeamAbbv();
	APIPopupCallsUtility.fetchTeamSeasonSchedule(teamAbbv, teamName, setScheduleData, setNoGame);
}

function setScheduleData(scheduleInfo) {
	const todayYear = commonUtilities.getTodayYear();
	const todayMonth = commonUtilities.getTodayMonth();
	const todayDay = commonUtilities.getTodayDay();
	const gameIndex = APIPopupDataUtility.findScheduleGameIndex(scheduleInfo, todayYear, todayMonth, todayDay);
	
	if (gameIndex && gameIndex >= 0) {
		const todayGame = APIPopupDataUtility.getTodaysGame(scheduleInfo, gameIndex);
		
		currentGameId = APIPopupDataUtility.getTodaysGameId(todayGame);
		var dateTime = new Date(APIPopupDataUtility.getTodaysGameDateTime(todayGame));
		localGameTime = getTimeZoneAdjustedTime(dateTime);
		teamName = commonUtilities.getTeamName();
		
		APIPopupCallsUtility.fetchCurrentGameData(currentGameId, teamName, setGameData, setNoGame);
	} else {
		gameStatus = "None";
		currentGameId = false;
		setFooterLinkHref("none", "", "", "");
		setNoGame();
	}
}

function setGameData(gameData) {
	const teamIsHome = APIPopupDataUtility.getHomeTeamId(gameData) === teamId;
	const gameToday = currentGameId != false;
	
	if (gameToday) {
		awayScore = APIPopupDataUtility.getAwayTeamScore(gameData);
		homeScore = APIPopupDataUtility.getHomeTeamScore(gameData);
		otherTeamName = teamIsHome ? APIPopupDataUtility.getAwayTeamName(gameData) : APIPopupDataUtility.getHomeTeamName(gameData);
		const awayTeamInitial = APIPopupDataUtility.getAwayTeamAbbrevLowerCase(gameData);
		const homeTeamInitial = APIPopupDataUtility.getHomeTeamAbbrevLowerCase(gameData);
		
		if (teamIsHome) {
			awayTeamIcon = "logos/" + otherTeamName + ".png";
			homeTeamIcon = teamIcon;

			awayTeamId = commonUtilities.getTeamIdMapping()[otherTeamName];
			homeTeamId = teamId;

			awayTeamName = otherTeamName;
			homeTeamName = teamName;

			drawAwayLogo("logos/" + otherTeamName + ".png");
			drawHomeLogo(teamIcon);
		} else {
			awayTeamIcon = teamIcon;
			homeTeamIcon = "logos/" + otherTeamName + ".png";

			awayTeamId = teamId;
			homeTeamId = commonUtilities.getTeamIdMapping()[otherTeamName];

			awayTeamName = teamName;
			homeTeamName = otherTeamName;

			drawAwayLogo(teamIcon);
			drawHomeLogo("logos/" + otherTeamName + ".png");
		}
		
		const gameState = APIPopupDataUtility.getGameState(gameData);
		if (gameState === APIPopupGameStates.FUTURE || gameState === APIPopupGameStates.PREGAME) {
			gameStatus = "Preview";
			setFooterLinkHref("preview", currentGameId, awayTeamInitial, homeTeamInitial);
			setPreview(gameData);
			currentlyPreGame = true;
		} else if (gameState === APIPopupGameStates.FINAL || gameState === APIPopupGameStates.OFF) {
			gameStatus = "Final";
			setFooterLinkHref("final", currentGameId, awayTeamInitial, homeTeamInitial);
			setFinal(gameData);
			currentlyPreGame = false;
		} else if (gameState === APIPopupGameStates.LIVE || gameState === APIPopupGameStates.CRITICAL) {
			gameStatus = "Live";
			setFooterLinkHref("live", currentGameId, awayTeamInitial, homeTeamInitial);
			setLive(gameData);
			currentlyPreGame = false;
		}
	}
}

function startInGameDataUpdateTimerIfNeeded() {
	if (gameTimeDataRefreshTimer == false) {
		gameTimeDataRefreshTimer = setInterval(updateData, 3000);
	}
}

function updateData() {
	if (!commonUtilities.getTeamAbbv()) {
		commonUtilities = CommonPopupUtilities.init();
	}
	
	commonUtilities.updateData();
	updateGameData(todayYear, todayMonth, todayDay);
}

function setTabListeners() {
	calendarTab.addEventListener('click', function () {hideShowElements(calendar);}, false);
	previewTab.addEventListener('click', function () {hideShowElements(playerStats);}, false);
	liveTab.addEventListener('click', function () {hideShowElements(rink);}, false);
	teamStatsTab.addEventListener('click', function () {hideShowElements(teamStats);}, false);
	playerStatsTab.addEventListener('click', function () {
		if (gameStatus === "Preview") {
			hideShowElements(playerStats);
		} else if (gameStatus === "Final") {
			hideShowElements(inGamePlayerStats);
		} else if (gameStatus == "Live") {
			hideShowElements(inGamePlayerStats);
		} else {
			hideShowElements(noGamePlayerStats);
		}
	}, false);
	standingsTab.addEventListener('click', function () {hideShowElements(standings);}, false);
}

function setCalendarButtonListeners() {
	const previousMonth = document.getElementById("previousMonth");
	const nextMonth = document.getElementById("nextMonth");

	previousMonth.addEventListener(
		'click',
		function() {
			commonUtilities.setPreviousCurrentCalendarMonth();
			setCalendar();
		},
		false
	);
	nextMonth.addEventListener(
		'click',
		function() {
			commonUtilities.setNextCurrentCalendarMonth();
			setCalendar();
		},
		false
	);
}

function setCalendar() {
	let calendarMonth = commonUtilities.getCurrentCalendarMonth() + 1;
	if (calendarMonth < 10) {
		calendarMonth = "0" + calendarMonth;
	}
	const calendarYear = commonUtilities.getCurrentCalendarYear();
	teamAbbv = commonUtilities.getTeamAbbv();
	
	APIPopupCallsUtility.fetchCalendarData(teamAbbv, calendarYear, calendarMonth, setCalendarHeader, setCalendarDates);
}

function setPreview(gameInfo) {
	show(previewTab);
	hide(liveTab);
	hide(teamStatsTab);
	hide(playerStatsTab);
	show(standingsTab);
	
	setHeadingSection(gameInfo, "preview");
	setPlayerStatsSection(gameInfo, "preview");
	if (firstOpen) {
		setStandingsSection();
	}

	setActiveTab(playerStats, "Preview");
}

function setLive(gameInfo) {
	const gameId = APIPopupDataUtility.getTodaysGameId(gameInfo);
	APIPopupCallsUtility.fetchPlayByPlayData(gameId, setRinkSection);
	
	hide(previewTab);
	show(liveTab);
	hide(teamStatsTab); // Not coming through in the new API data
	show(playerStatsTab);
	show(standingsTab);
	
	setHeadingSection(gameInfo, "live");
	setTeamStatsSection(gameInfo);
	setPlayerStatsSection(gameInfo, "live");
	if (firstOpen) {
		setStandingsSection();
	}

	setActiveTab(rink, "Live");
}

function setFinal(gameInfo) {
	hide(previewTab);
	hide(liveTab);
	show(teamStatsTab);
	show(playerStatsTab);
	show(standingsTab);

	if (gameTimeDataRefreshTimer) {
		document.clearInterval(gameTimeDataRefreshTimer);
		gameTimeDataRefreshTimer = false;
	}
	
	setHeadingSection(gameInfo, "final");
	setTeamStatsSection(gameInfo);
	setPlayerStatsSection(gameInfo, "final");
	if (firstOpen) {
		setStandingsSection();
	}

	setActiveTab(teamStats, "Final");
}

function setNoGame() {
	hide(previewTab);
	hide(liveTab);
	hide(teamStatsTab);
	show(playerStatsTab);
	show(standingsTab);
	
	setHeadingSection(null, "none");
	setPlayerStatsSection(null, "none");
	if (firstOpen) {
		setStandingsSection();
	}

	setActiveTab(calendar, "None");
}

function setHeadingSection(gameData, gameStatus) {
	const headingAwayScore = document.getElementById("awayScore");
	const timeLeft = document.getElementById("time");
	const headingHomeScore = document.getElementById("homeScore");

	switch(gameStatus) {
		case "preview":
			drawAwayLogo(awayTeamIcon);
			drawHomeLogo(homeTeamIcon);
			var dateTime = new Date(APIPopupDataUtility.getTodaysGameDateTime(gameData));
			timeLeft.innerHTML = "Puck Drop: " + getTimeZoneAdjustedTime(dateTime);
			headingAwayScore.innerHTML = "";
			headingHomeScore.innerHTML = "";
			break;
		case "live":
			drawAwayLogo(awayTeamIcon);
			drawHomeLogo(homeTeamIcon);
			var period = APIPopupDataUtility.getCurrentPeriod(gameData);
			var isShootout = APIPopupDataUtility.getCurrentPeriodType(gameData) === APIPopupGameStates.SHOOTOUT;
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
				default:
					period = "OT";
					break;
			}
			
			if (APIPopupDataUtility.getIsInIntermission(gameData)) {
				headingAwayScore.innerHTML = awayScore;
				headingHomeScore.innerHTML = homeScore;
				timeLeft.innerHTML = APIPopupDataUtility.getGameTimeRemaining(gameData) + " / INT";
			} else {
				if (isShootout) {
					headingAwayScore.innerHTML = APIPopupDataUtility.getAwayTeamShootoutGoals(gameData);
					headingHomeScore.innerHTML = APIPopupDataUtility.getHomeTeamShootoutGoals(gameData);
					timeLeft.innerHTML = APIPopupGameStates.SHOOTOUT;
				} else {
					headingAwayScore.innerHTML = awayScore;
					headingHomeScore.innerHTML = homeScore;
					timeLeft.innerHTML = APIPopupDataUtility.getGameTimeRemaining(gameData) + " / " + period;
				}
			}
			startInGameDataUpdateTimerIfNeeded();
			break;
		case "final":
			drawAwayLogo(awayTeamIcon);
			drawHomeLogo(homeTeamIcon);
			timeLeft.innerHTML = "Final";
			headingAwayScore.innerHTML = awayScore;
			headingHomeScore.innerHTML = homeScore;
			break;
		case "none":
			drawAwayLogo(teamIcon);
			drawHomeLogo(teamIcon);
			timeLeft.innerHTML = "No Game";
			headingAwayScore.innerHTML = "";
			headingHomeScore.innerHTML = "";
			break;
	}
}

function setCalendarHeader() {
	const monthName = document.getElementById("monthName");
	monthName.innerHTML = commonUtilities.getCurrentCalendarMonthName() + " " + commonUtilities.getCurrentCalendarYear();
}

function setCalendarDates(calendarData) {
	clearCalendar();
	const currentYear = commonUtilities.getCurrentCalendarYear();
	const currentMonth = commonUtilities.getCurrentCalendarMonth();
	const firstDay = new Date(currentYear, currentMonth, 1).getDay();
	const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
	const todayDate = new Date(commonUtilities.getTodayYear(), commonUtilities.getTodayMonth() - 1, commonUtilities.getTodayDay());
	const games = APIPopupDataUtility.getCalendarGames(calendarData);

	for (let i = 1; i <= lastDay; i++) {
		const currentDate = firstDay + i;
		const calendarDay = document.getElementById("calendarDay" + currentDate);
		const calendarDate = document.getElementById("calendarDate" + currentDate);
		const calendarGameLogo = document.getElementById("calendarGameLogo" + currentDate);
		const calendarGameTime = document.getElementById("calendarGameTime" + currentDate);

		calendarDate.innerHTML = i;

		for (let j = 0; j < games.length; j++) {
			const gameDate = new Date(APIPopupDataUtility.getTodaysGameDateTime(games[j]));

			if (gameDate.getDate() === i) {
				const gameData = games[j];
				let awayScore = APIPopupDataUtility.getAwayTeamScore(gameData);
				let homeScore = APIPopupDataUtility.getHomeTeamScore(gameData);
				let isHomeTeam = false;

				if (APIPopupDataUtility.getAwayTeamId(gameData) === teamId) {
					isHomeTeam = false;
					calendarGameLogo.src = "logos/" + commonUtilities.getTeamNameAbbvMapping()[APIPopupDataUtility.getHomeTeamAbbrev(gameData)] + ".png";
					addClass(calendarDay, "awayGame");
				} else {
					isHomeTeam = true;
					calendarGameLogo.src = "logos/" + commonUtilities.getTeamNameAbbvMapping()[APIPopupDataUtility.getAwayTeamAbbrev(gameData)] + ".png";
					addClass(calendarDay, "homeGame");
				}

				const gameState = APIPopupDataUtility.getGameState(gameData);
				if (gameState === APIPopupGameStates.FINAL || gameState === APIPopupGameStates.OFF) {
					const winOrLoss = isHomeTeam ? homeScore > awayScore ? "W" : "L" : awayScore > homeScore ? "W" : "L";
					calendarGameTime.innerHTML = awayScore + " - " + homeScore + " " + winOrLoss;
				} else if (gameState === APIPopupGameStates.FUTURE || gameState === APIPopupGameStates.PREGAME) {
					const dateTime = new Date(APIPopupDataUtility.getTodaysGameDateTime(gameData));
					calendarGameTime.innerHTML = getTimeZoneAdjustedTime(dateTime);
				} else if (gameState === APIPopupGameStates.Postponed) {
					calendarGameTime.innerHTML = APIPopupGameStates.POSTPONED;
				} else {
					calendarGameTime.innerHTML = awayScore + " - " + homeScore;
				}
				
				show(calendarGameLogo);
			}
		}
		
		if (currentYear === todayDate.getFullYear() && currentMonth === todayDate.getMonth() && todayDate.getDate() === i) {
			calendarDay.innerHTML += "<div class='today' id='today'></div>";
		}
	}
}

function clearCalendar() {
	for (let i = 1; i < 42; i++) {
		const calendarDay = document.getElementById("calendarDay" + i);
		const calendarDate = document.getElementById("calendarDate" + i);
		const calendarGameLogo = document.getElementById("calendarGameLogo" + i);
		const calendarGameTime = document.getElementById("calendarGameTime" + i);
		const today = document.getElementById("today");

		calendarDate.innerHTML = "";

		removeClass(calendarDay, "homeGame");
		removeClass(calendarDay, "awayGame");

		calendarGameTime.innerHTML = "";

		hide(calendarGameLogo);

		if (today && calendarDay.children.length == 3) {
			calendarDay.removeChild(today);
		}
	}
}

function setRinkSection(gameData) {
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
	const awayOnIce = APIPopupDataUtility.getAwayTeamOnIce(gameData);
	const homeOnIce = APIPopupDataUtility.getHomeTeamOnIce(gameData);
	const rosterSpots = APIPopupDataUtility.getRosterSpots(gameData);

	if(awayTeamOnIce !== awayOnIce) {
		for(var i = 0; i < awayOnIce.length; i++) {
			const player = APIPopupDataUtility.getOnIcePlayer(rosterSpots, awayOnIce[i]);
			const fullName = APIPopupDataUtility.getPlayerFullName(player);
			const sweaterNumber = APIPopupDataUtility.getPlayerSweaterNumber(player);
			
			switch(APIPopupDataUtility.getPlayerPositionCode(player)) {
				case "D":
					if(awayTeamDefense.length === 0) {
						awayTeamDefense.push(awayOnIce[i]);
						awayLeftDefense.innerHTML = sweaterNumber ?? 0;
						awayLeftDefense.setAttribute('title', fullName);
					} else if (awayTeamDefense.length === 1) {
						awayTeamDefense.push(awayOnIce[i]);
						awayRightDefense.innerHTML = sweaterNumber ?? 0;
						awayRightDefense.setAttribute('title', fullName);
					} else {
						if (!awayOnIce.includes(awayTeamDefense[0])) {
							awayTeamDefense = [awayOnIce[i], awayTeamDefense[1]];
							awayLeftDefense.innerHTML = sweaterNumber ?? 0;
							awayLeftDefense.setAttribute('title', fullName);
						} else if (!awayOnIce.includes(awayTeamDefense[1])) {
							awayTeamDefense = [awayTeamDefense[0], awayOnIce[i]];
							awayRightDefense.innerHTML = sweaterNumber ?? 0;
							awayRightDefense.setAttribute('title', fullName);
						}
					}
					break;
				case "G":
					if (awayGoalie.innerHTML !== sweaterNumber ?? 0) {
						awayGoalie.innerHTML = sweaterNumber ?? 0;
						awayGoalie.setAttribute('title', fullName);
					}
					break;
				default:
					if (awayTeamOffense.length < 3) {
						awayTeamOffense.push(awayOnIce[i]);
						if (awayTeamOffense.length === 0) {
							awayLeftWing.innerHTML = sweaterNumber ?? 0;
							awayLeftWing.setAttribute('title', fullName);
						} else if (awayTeamOffense.length === 1) {
							awayCenter.innerHTML = sweaterNumber ?? 0;
							awayCenter.setAttribute('title', fullName);
						} else if (awayTeamOffense.length === 2) {
							awayRightWing.innerHTML = sweaterNumber ?? 0;
							awayRightWing.setAttribute('title', fullName);
						}
					} else {
						if (!awayOnIce.includes(awayTeamOffense[0])) {
							awayTeamOffense = [awayOnIce[i], awayTeamOffense[1], awayTeamOffense[2]];
							awayLeftWing.innerHTML = sweaterNumber ?? 0;
							awayLeftWing.setAttribute('title', fullName);
						} else if (!awayOnIce.includes(awayTeamOffense[1])) {
							awayTeamOffense = [awayTeamOffense[0], awayOnIce[i], awayTeamOffense[2]];
							awayCenter.innerHTML = sweaterNumber ?? 0;
							awayCenter.setAttribute('title', fullName);
						} else if (!awayOnIce.includes(awayTeamOffense[2])) {
							awayTeamOffense = [awayTeamOffense[0], awayTeamOffense[1], awayOnIce[i]];
							awayRightWing.innerHTML = sweaterNumber ?? 0;
							awayRightWing.setAttribute('title', fullName);
						}
					}
					break;
			}
		}
		
		awayTeamOnIce = awayOnIce;
	}
	
	if(homeTeamOnIce !== homeOnIce) {
		for(var i = 0; i < homeOnIce.length; i++) {
			const player = APIPopupDataUtility.getOnIcePlayer(rosterSpots, homeOnIce[i]);
			const fullName = APIPopupDataUtility.getPlayerFullName(player);
			const sweaterNumber = APIPopupDataUtility.getPlayerSweaterNumber(player);
			
			switch(APIPopupDataUtility.getPlayerPositionCode(player)) {
				case "D":
					if(homeTeamDefense.length === 0) {
						homeTeamDefense.push(homeOnIce[i]);
						homeLeftDefense.innerHTML = sweaterNumber ?? 0;
						homeLeftDefense.setAttribute('title', fullName);
					} else if (homeTeamDefense.length === 1) {
						homeTeamDefense.push(homeOnIce[i]);
						homeRightDefense.innerHTML = sweaterNumber ?? 0;
						homeRightDefense.setAttribute('title', fullName);
					} else {
						if (!homeOnIce.includes(homeTeamDefense[0])) {
							homeTeamDefense = [homeOnIce[i], homeTeamDefense[1]];
							homeLeftDefense.innerHTML = sweaterNumber ?? 0;
							homeLeftDefense.setAttribute('title', fullName);
						} else if (!homeOnIce.includes(homeTeamDefense[1])) {
							homeTeamDefense = [homeTeamDefense[0], homeOnIce[i]];
							homeRightDefense.innerHTML = sweaterNumber ?? 0;
							homeRightDefense.setAttribute('title', fullName);
						}
					}
					break;
				case "G":
					if (homeGoalie.innerHTML !== sweaterNumber ?? 0) {
						homeGoalie.innerHTML = sweaterNumber ?? 0;
						homeGoalie.setAttribute('title', fullName);
					}
					break;
				default:
					if (homeTeamOffense.length < 3) {
						homeTeamOffense.push(homeOnIce[i]);
						if (homeTeamOffense.length === 0) {
							homeLeftWing.innerHTML = sweaterNumber ?? 0;
							homeLeftWing.setAttribute('title', fullName);
						} else if (homeTeamOffense.length === 1) {
							homeCenter.innerHTML = sweaterNumber ?? 0;
							homeCenter.setAttribute('title', fullName);
						} else if (homeTeamOffense.length === 2) {
							homeRightWing.innerHTML = sweaterNumber ?? 0;
							homeRightWing.setAttribute('title', fullName);
						}
					} else {
						if (!homeOnIce.includes(homeTeamOffense[0])) {
							homeTeamOffense = [homeOnIce[i], homeTeamOffense[1], homeTeamOffense[2]];
							homeLeftWing.innerHTML = sweaterNumber ?? 0;
							homeLeftWing.setAttribute('title', fullName);
						} else if (!homeOnIce.includes(homeTeamOffense[1])) {
							homeTeamOffense = [homeTeamOffense[0], homeOnIce[i], homeTeamOffense[2]];
							homeCenter.innerHTML = sweaterNumber ?? 0;
							homeCenter.setAttribute('title', fullName);
						} else if (!homeOnIce.includes(homeTeamOffense[2])) {
							homeTeamOffense = [homeTeamOffense[0], homeTeamOffense[1], homeOnIce[i]];
							homeRightWing.innerHTML = sweaterNumber ?? 0;
							homeRightWing.setAttribute('title', fullName);
						}
					}
					break;
			}
		}
		
		homeTeamOnIce = homeOnIce;
	}
}

function setTeamStatsSection(gameData) {
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

	const awayTeamStats = APIPopupDataUtility.getAwayTeam(gameData);
	awayTeamSOG.innerHTML = awayTeamStats.sog ?? 0;
	awayTeamFO.innerHTML = awayTeamStats.faceoffWinningPctg ?? 0;
	awayTeamPPG.innerHTML = awayTeamStats.powerPlayConversion ?? '0/0';
	awayTeamPIM.innerHTML = awayTeamStats.pim ?? 0;
	awayTeamHITS.innerHTML = awayTeamStats.hits ?? 0;
	awayTeamBLKS.innerHTML = awayTeamStats.blocks ?? 0;
	// awayTeamGVA.innerHTML = awayTeamStats.giveaways ?? 0; Not in new version of API
	
	const homeTeamStats = APIPopupDataUtility.getHomeTeam(gameData);
	homeTeamSOG.innerHTML = homeTeamStats.sog ?? 0;
	homeTeamFO.innerHTML = homeTeamStats.faceoffWinningPctg ?? 0;
	homeTeamPPG.innerHTML = homeTeamStats.powerPlayConversion ?? '0/0';
	homeTeamPIM.innerHTML = homeTeamStats.pim ?? 0;
	homeTeamHITS.innerHTML = homeTeamStats.hits ?? 0;
	homeTeamBLKS.innerHTML = homeTeamStats.blocks ?? 0;
	// homeTeamGVA.innerHTML = homeTeamStats.giveaways ?? 0; Not in new version of API
}

function setPlayerStatsSection(gameData, gameStatus) {
	if (gameStatus === "preview") {
		const awayPlayerStatsTeamName = document.getElementById("awayPlayerStatsTeamName");
		const homePlayerStatsTeamName = document.getElementById("homePlayerStatsTeamName");
		awayPlayerStatsTeamName.innerHTML = awayTeamName;
		homePlayerStatsTeamName.innerHTML = homeTeamName;

		const awayTeamPlayerStats = document.getElementById("awayTeamPlayerStats");
		const homeTeamPlayerStats = document.getElementById("homeTeamPlayerStats");
		const awayStatsButton = document.getElementById("awayStatsButton");
		const homeStatsButton = document.getElementById("homeStatsButton");
		awayStatsButton.addEventListener('click', function () {
			hide(homeTeamPlayerStats);
			removeClass(homeStatsButton, "selected");
			show(awayTeamPlayerStats);
			addClass(awayStatsButton, "selected");
		}, false);
		homeStatsButton.addEventListener('click', function () {
			hide(awayTeamPlayerStats);
			removeClass(awayStatsButton, "selected");
			show(homeTeamPlayerStats);
			addClass(homeStatsButton, "selected");
		}, false);
		
		const awayTeamAbbv = commonUtilities.getTeamAbbvs()[awayTeamName];
		APIPopupCallsUtility.fetchAwayTeamPlayerStats(awayTeamAbbv, setAwayNonLivePlayerStats);
		
		const homeTeamAbbv = commonUtilities.getTeamAbbvs()[homeTeamName];
		APIPopupCallsUtility.fetchHomeTeamPlayerStats(homeTeamAbbv, setHomeNonLivePlayerStats);
	} else if (gameStatus === "live" || gameStatus === "final") {
		const inGamePlayerStats = document.getElementById("inGamePlayerStats");

		const inGameAwayStatsButton = document.getElementById("inGameAwayStatsButton");
		const inGameHomeStatsButton = document.getElementById("inGameHomeStatsButton");
		const inGameAwayTeam = document.getElementById("inGameAwayTeam");
		const inGameHomeTeam = document.getElementById("inGameHomeTeam");
		inGameAwayStatsButton.addEventListener('click', function () {
			hide(inGameHomeTeam);
			removeClass(inGameHomeStatsButton, "selected");
			show(inGameAwayTeam);
			addClass(inGameAwayStatsButton, "selected");
		}, false);
		inGameHomeStatsButton.addEventListener('click', function () {
			hide(inGameAwayTeam);
			removeClass(inGameAwayStatsButton, "selected");
			show(inGameHomeTeam);
			addClass(inGameHomeStatsButton, "selected");
		}, false);

		const inGameAwayPlayerStatsTeamName = document.getElementById("inGameAwayPlayerStatsTeamName");
		const inGameHomePlayerStatsTeamName = document.getElementById("inGameHomePlayerStatsTeamName");
		inGameAwayStatsButton.innerHTML = awayTeamName;
		inGameHomeStatsButton.innerHTML = homeTeamName;
		inGameAwayPlayerStatsTeamName.innerHTML = awayTeamName;
		inGameHomePlayerStatsTeamName.innerHTML = homeTeamName;

		const inGameAwayTeamForwards = document.getElementById("inGameAwayTeamForwards");
		const inGameAwayTeamDefense = document.getElementById("inGameAwayTeamDefense");
		const inGameAwayTeamGoalies = document.getElementById("inGameAwayTeamGoalies");
		clearElement(inGameAwayTeamForwards);
		clearElement(inGameAwayTeamDefense);
		clearElement(inGameAwayTeamGoalies);

		const inGameHomeTeamForwards = document.getElementById("inGameHomeTeamForwards");
		const inGameHomeTeamDefense = document.getElementById("inGameHomeTeamDefense");
		const inGameHomeTeamGoalies = document.getElementById("inGameHomeTeamGoalies");
		clearElement(inGameHomeTeamForwards);
		clearElement(inGameHomeTeamDefense);
		clearElement(inGameHomeTeamGoalies);
		
		const awayTeamPlayers = APIPopupDataUtility.getAwayPlayerByGameStats(gameData);
		const awayTeamForwards = APIPopupDataUtility.getAwayTeamForwards(awayTeamPlayers);
		const awayTeamDefense = APIPopupDataUtility.getAwayTeamDefense(awayTeamPlayers);
		const awayTeamGoalies = APIPopupDataUtility.getAwayTeamGoalies(awayTeamPlayers);
		const homeTeamPlayers = APIPopupDataUtility.getHomePlayerByGameStats(gameData);
		const homeTeamForwards = APIPopupDataUtility.getHomeTeamForwards(homeTeamPlayers);
		const homeTeamDefense = APIPopupDataUtility.getHomeTeamDefense(homeTeamPlayers);
		const homeTeamGoalies = APIPopupDataUtility.getHomeTeamGoalies(homeTeamPlayers);
		
		for(let i = 0; i < awayTeamForwards.length; i++) {
			addInGamePlayerStat(awayTeamForwards[i], inGameAwayTeamForwards);
		}
		
		for(let i = 0; i < awayTeamDefense.length; i++) {
			addInGamePlayerStat(awayTeamDefense[i], inGameAwayTeamDefense);
		}
		
		for(let i = 0; i < awayTeamGoalies.length; i++) {
			addInGamePlayerStat(awayTeamGoalies[i], inGameAwayTeamGoalies, true);
		}
		
		for(let i = 0; i < homeTeamForwards.length; i++) {
			addInGamePlayerStat(homeTeamForwards[i], inGameHomeTeamForwards);
		}
		
		for(let i = 0; i < homeTeamDefense.length; i++) {
			addInGamePlayerStat(homeTeamDefense[i], inGameHomeTeamDefense);
		}
		
		for(let i = 0; i < homeTeamGoalies.length; i++) {
			addInGamePlayerStat(homeTeamGoalies[i], inGameHomeTeamGoalies, true);
		}
	} else {
		teamAbbv = commonUtilities.getTeamAbbv();
		APIPopupCallsUtility.fetchNonLivePlayerStats(teamAbbv, setNonLivePlayerStats);
	}
}

function setAwayNonLivePlayerStats(playerStats, teamAbbv) {
	const awayTeamForwards = document.getElementById("awayTeamForwards");
	const awayTeamDefense = document.getElementById("awayTeamDefense");
	const awayTeamGoalies = document.getElementById("awayTeamGoalies");
	clearElement(awayTeamForwards);
	clearElement(awayTeamDefense);
	clearElement(awayTeamGoalies);
	
	APIPopupCallsUtility.fetchNonLiveRosterStats(teamAbbv, addPlayerStats, playerStats, awayTeamDefense, awayTeamForwards, awayTeamGoalies);
}

function setHomeNonLivePlayerStats(playerStats, teamAbbv) {
	const homeTeamForwards = document.getElementById("homeTeamForwards");
	const homeTeamDefense = document.getElementById("homeTeamDefense");
	const homeTeamGoalies = document.getElementById("homeTeamGoalies");
	clearElement(homeTeamForwards);
	clearElement(homeTeamDefense);
	clearElement(homeTeamGoalies);
	
	APIPopupCallsUtility.fetchNonLiveRosterStats(teamAbbv, addPlayerStats, playerStats, homeTeamDefense, homeTeamForwards, homeTeamGoalies);
}

function setNonLivePlayerStats(playerStats) {
	const noGamePlayerStatsTeamName = document.getElementById("noGamePlayerStatsTeamName");
	noGamePlayerStatsTeamName.innerHTML = teamName;

	const teamForwards = document.getElementById("noGameForwards");
	const teamDefense = document.getElementById("noGameDefense");
	const teamGoalies = document.getElementById("noGameGoalies");
	clearElement(teamForwards);
	clearElement(teamDefense);
	clearElement(teamGoalies);
	teamAbbv = commonUtilities.getTeamAbbv();
	
	APIPopupCallsUtility.fetchNonLiveRosterStats(teamAbbv, addPlayerStats, playerStats, teamDefense, teamForwards, teamGoalies);
}

function addPlayerStats(playerStats, rosterData, defenseElement, forwardsElement, goaliesElement) {
	const skaters = APIPopupDataUtility.getSkatersStats(playerStats);
	for(let i = 0; i < skaters.length; i++) {
		const player = skaters[i];
		
		if (APIPopupDataUtility.getPlayerPositionCode(player) === "D") {
			const defenseman = APIPopupDataUtility.findDefensemanByFullName(rosterData, player);
			addPlayerStat(player, defenseElement, false, APIPopupDataUtility.getPlayerSweaterNumber(defenseman));
		} else {
			const forward = APIPopupDataUtility.findForwardByFullName(rosterData, player);
			addPlayerStat(player, forwardsElement, false, APIPopupDataUtility.getPlayerSweaterNumber(forward));
		}
	}
	
	const goalies = APIPopupDataUtility.getGoaliesStats(playerStats);
	for(let i = 0; i < goalies.length; i++) {
		const player = goalies[i];
		const goalie = APIPopupDataUtility.findGoalieByFullName(rosterData, player);
		
		addPlayerStat(player, goaliesElement, true, APIPopupDataUtility.getPlayerSweaterNumber(goalie));
	}
}

function setStandingsSection() {
	const divisionStandings = document.getElementById("divisionStandings");
	const wildCardStandings = document.getElementById("wildCardStandings");
	const conferenceStandings = document.getElementById("conferenceStandings");
	const leagueStandings = document.getElementById("leagueStandings");

	const divisionStandingsButton = document.getElementById("divisionStandingsButton");
	const wildCardStandingsButton = document.getElementById("wildCardStandingsButton");
	const conferenceStandingsButton = document.getElementById("conferenceStandingsButton");
	const leagueStandingsButton = document.getElementById("leagueStandingsButton");
	divisionStandingsButton.addEventListener('click', function () {
		hide(wildCardStandings);
		hide(conferenceStandings);
		hide(leagueStandings);
		removeClass(wildCardStandingsButton, "selected");
		removeClass(conferenceStandingsButton, "selected");
		removeClass(leagueStandingsButton, "selected");
		show(divisionStandings);
		addClass(divisionStandingsButton, "selected");
	}, false);
	wildCardStandingsButton.addEventListener('click', function () {
		hide(divisionStandings);
		hide(conferenceStandings);
		hide(leagueStandings);
		removeClass(divisionStandingsButton, "selected");
		removeClass(conferenceStandingsButton, "selected");
		removeClass(leagueStandingsButton, "selected");
		show(wildCardStandings);
		addClass(wildCardStandingsButton, "selected");
	}, false);
	conferenceStandingsButton.addEventListener('click', function () {
		hide(divisionStandings);
		hide(wildCardStandings);
		hide(leagueStandings);
		removeClass(divisionStandingsButton, "selected");
		removeClass(wildCardStandingsButton, "selected");
		removeClass(leagueStandingsButton, "selected");
		show(conferenceStandings);
		addClass(conferenceStandingsButton, "selected");
	}, false);
	leagueStandingsButton.addEventListener('click', function () {
		hide(divisionStandings);
		hide(wildCardStandings);
		hide(conferenceStandings);
		removeClass(divisionStandingsButton, "selected");
		removeClass(wildCardStandingsButton, "selected");
		removeClass(conferenceStandingsButton, "selected");
		show(leagueStandings);
		addClass(leagueStandingsButton, "selected");
	}, false);
	
	APIPopupCallsUtility.fetchStandings(setStandingsData);
}

function setFooterLinkHref(gameStatus, currentGameId, awayTeamInitial, homeTeamInitial) {
	const nhlLink = document.getElementById("nhlLink");
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

function addInGamePlayerStat(player, element, isGoalie = false) {
	const playerNameArray = APIPopupDataUtility.getPlayerNameArray(player);
	const statLine = document.createElement("div");
	addClass(statLine, "playerStatsLine");

	const nameNumber = document.createElement("div");
	addClass(nameNumber, "nameNumber");
	const number = document.createElement("div");
	addClass(number, "number");
	number.innerHTML = APIPopupDataUtility.getPlayerSweaterNumber(player);
	const name = document.createElement("div");
	addClass(name, "name");
	name.innerHTML = playerNameArray[playerNameArray.length - 1];
	nameNumber.appendChild(number);
	nameNumber.appendChild(name);
	statLine.appendChild(nameNumber);

	const stats = document.createElement("div");
	addClass(stats, "stats");

	if (!isGoalie) {
		const shots = document.createElement("div");
		addClass(shots, "stat");
		shots.innerHTML = APIPopupDataUtility.getPlayerShots(player);
		stats.appendChild(shots);
		const goals = document.createElement("div");
		addClass(goals, "stat");
		goals.innerHTML = APIPopupDataUtility.getPlayerGoals(player);
		stats.appendChild(goals);
		const assists = document.createElement("div");
		addClass(assists, "stat");
		assists.innerHTML = APIPopupDataUtility.getPlayerAssists(player);
		stats.appendChild(assists);
		const points = document.createElement("div");
		addClass(points, "stat");
		points.innerHTML = APIPopupDataUtility.getPlayerPoints(player);
		stats.appendChild(points);
		const plusMinus = document.createElement("div");
		addClass(plusMinus, "stat");
		plusMinus.innerHTML = APIPopupDataUtility.getPlayerPlusMinus(player);
		stats.appendChild(plusMinus);
		const penaltyMinutes = document.createElement("div");
		addClass(penaltyMinutes, "stat");
		penaltyMinutes.innerHTML = APIPopupDataUtility.getPlayerPIMs(player);
		stats.appendChild(penaltyMinutes);
		const powerPlay = document.createElement("div");
		addClass(powerPlay, "stat");
		powerPlay.innerHTML = APIPopupDataUtility.getPlayerPowerPlayGoals(player);
		stats.appendChild(powerPlay);
		const shortHanded = document.createElement("div");
		addClass(shortHanded, "stat");
		shortHanded.innerHTML = APIPopupDataUtility.getPlayerShorthandedGoals(player);
		stats.appendChild(shortHanded);
	} else {
		const evenShotsAgainst = document.createElement("div");
		addClass(evenShotsAgainst, "stat");
		evenShotsAgainst.innerHTML = APIPopupDataUtility.getGoalieEvenStrengthShotsAgainst(player);
		stats.appendChild(evenShotsAgainst);
		const powerPlayShotsAgainst = document.createElement("div");
		addClass(powerPlayShotsAgainst, "stat");
		powerPlayShotsAgainst.innerHTML = APIPopupDataUtility.getGoaliePowerPlayShotsAgainst(player);
		stats.appendChild(powerPlayShotsAgainst);
		const shortHandedShotsAgainst = document.createElement("div");
		addClass(shortHandedShotsAgainst, "stat");
		shortHandedShotsAgainst.innerHTML = APIPopupDataUtility.getGoalieShorthandedShotsAgainst(player);
		stats.appendChild(shortHandedShotsAgainst);
		const savesShotsAgainst = document.createElement("div");
		addClass(savesShotsAgainst, "stat");
		addClass(savesShotsAgainst, "savesShots");
		savesShotsAgainst.innerHTML = APIPopupDataUtility.getGoalieSaveShotsAgainst(player);
		stats.appendChild(savesShotsAgainst);
		const savePercent = document.createElement("div");
		addClass(savePercent, "stat");
		savePercent.innerHTML = APIPopupDataUtility.getGoalieSavePercentage(player);
		stats.appendChild(savePercent);
		const penaltyMinutes = document.createElement("div");
		addClass(penaltyMinutes, "stat");
		penaltyMinutes.innerHTML = APIPopupDataUtility.getGoaliePIMs(player) ?? 0;
		stats.appendChild(penaltyMinutes);
		const timeOnIce = document.createElement("div");
		addClass(timeOnIce, "stat");
		timeOnIce.innerHTML = APIPopupDataUtility.getGoalieTimeOnIce(player);
		stats.appendChild(timeOnIce);
	}

	statLine.appendChild(stats);
	element.appendChild(statLine);
}

function addPlayerStat(player, element, isGoalie = false, sweaterNumber = 0) {
	let playerName = "";
	if (player.lastName) {
		playerName = APIPopupDataUtility.getPlayerLastName(player);
	} else {
		playerName = APIPopupDataUtility.getPlayerName(player);
	}
	
	const statLine = document.createElement("div");
	addClass(statLine, "playerStatsLine");

	const nameNumber = document.createElement("div");
	addClass(nameNumber, "nameNumber");
	const number = document.createElement("div");
	addClass(number, "number");
	number.innerHTML = sweaterNumber;
	const name = document.createElement("div");
	addClass(name, "name");
	name.innerHTML = playerName;
	nameNumber.appendChild(number);
	nameNumber.appendChild(name);
	statLine.appendChild(nameNumber);

	const statsElement = document.createElement("div");
	addClass(statsElement, "stats");

	if (!isGoalie) {
		const games = document.createElement("div");
		addClass(games, "stat");
		const gamesStat = APIPopupDataUtility.getPlayerGamesPlayed(player);
		games.innerHTML = gamesStat ? gamesStat : 0;
		statsElement.appendChild(games);
		const goals = document.createElement("div");
		addClass(goals, "stat");
		const goalsStat = APIPopupDataUtility.getPlayerGoals(player);
		goals.innerHTML = goalsStat ? goalsStat : 0;
		statsElement.appendChild(goals);
		const assists = document.createElement("div");
		addClass(assists, "stat");
		const assistsStat = APIPopupDataUtility.getPlayerAssists(player);
		assists.innerHTML = assistsStat ? assistsStat : 0;
		statsElement.appendChild(assists);
		const points = document.createElement("div");
		addClass(points, "stat");
		const pointsStat = APIPopupDataUtility.getPlayerPoints(player);
		points.innerHTML = pointsStat ? pointsStat : 0;
		statsElement.appendChild(points);
		const plusMinus = document.createElement("div");
		addClass(plusMinus, "stat");
		const plusMinusStat = APIPopupDataUtility.getPlayerPlusMinus(player);
		plusMinus.innerHTML = plusMinusStat ? plusMinusStat : 0;
		statsElement.appendChild(plusMinus);
		const penaltyMinutes = document.createElement("div");
		addClass(penaltyMinutes, "stat");
		const penaltyMinutesStat = APIPopupDataUtility.getPlayerPIMs(player);
		penaltyMinutes.innerHTML = penaltyMinutesStat ? penaltyMinutesStat : 0;
		statsElement.appendChild(penaltyMinutes);
		const powerPlay = document.createElement("div");
		addClass(powerPlay, "stat");
		const powerPlayStat = APIPopupDataUtility.getPlayerPowerPlayGoals(player);
		powerPlay.innerHTML = powerPlayStat ? powerPlayStat : 0;
		statsElement.appendChild(powerPlay);
		const gameWinning = document.createElement("div");
		addClass(gameWinning, "stat");
		const gameWinningStat = APIPopupDataUtility.getPlayerGameWinningGoals(player);
		gameWinning.innerHTML = gameWinningStat ? gameWinningStat : 0;
		statsElement.appendChild(gameWinning);
	} else {
		const games = document.createElement("div");
		addClass(games, "stat");
		const gamesStat = APIPopupDataUtility.getPlayerGamesPlayed(player);
		games.innerHTML = gamesStat ? gamesStat : 0;
		statsElement.appendChild(games);
		const wins = document.createElement("div");
		addClass(wins, "stat");
		const winsStat = APIPopupDataUtility.getGoalieWins(player);
		wins.innerHTML = winsStat ? winsStat : 0;
		statsElement.appendChild(wins);
		const losses = document.createElement("div");
		addClass(losses, "stat");
		const lossesStat = APIPopupDataUtility.getGoalieLosses(player);
		losses.innerHTML = lossesStat ? lossesStat : 0;
		statsElement.appendChild(losses);
		const shotsAgainst = document.createElement("div");
		addClass(shotsAgainst, "stat");
		const shotsAgainstStat = APIPopupDataUtility.getGoalieShotsAgainst(player);
		shotsAgainst.innerHTML = shotsAgainstStat ? shotsAgainstStat : 0;
		statsElement.appendChild(shotsAgainst);
		const goalsAgainst = document.createElement("div");
		addClass(goalsAgainst, "stat");
		const goalsAgainstStat = APIPopupDataUtility.getGoalieGoalsAgainst(player);
		goalsAgainst.innerHTML = goalsAgainstStat ? goalsAgainstStat : 0;
		statsElement.appendChild(goalsAgainst);
		const goalAgainstAverage = document.createElement("div");
		addClass(goalAgainstAverage, "stat");
		const goalsAgainstAverageStat = APIPopupDataUtility.getGoalieGoalsAgainstAverage(player);
		goalAgainstAverage.innerHTML = goalsAgainstAverageStat;
		statsElement.appendChild(goalAgainstAverage);
		const savePercent = document.createElement("div");
		addClass(savePercent, "stat");
		const savePercentageStat = APIPopupDataUtility.getGoalieNonLiveSavePercentage(player);
		savePercent.innerHTML = savePercentageStat;
		statsElement.appendChild(savePercent);
		const shutouts = document.createElement("div");
		addClass(shutouts, "stat");
		const shutoutsStat = APIPopupDataUtility.getGoalieShutouts(player);
		shutouts.innerHTML = shutoutsStat ? shutoutsStat : 0;
		statsElement.appendChild(shutouts);
	}

	statLine.appendChild(statsElement);
	element.appendChild(statLine);
}

function setStandingsData(standingsData) {
	const divisionTeamStandings = document.getElementById("divisionTeamStandings");
	const conferenceTeamStandings = document.getElementById("conferenceTeamStandings");
	const leagueTeamStandings = document.getElementById("leagueTeamStandings");
	clearElement(divisionTeamStandings);
	clearElement(conferenceTeamStandings);
	clearElement(leagueTeamStandings);
	
	setDivisionData(standingsData, divisionTeamStandings);
	setConferenceData(standingsData, conferenceTeamStandings);
	setLeagueData(standingsData, leagueTeamStandings);
}

function setDivisionData(standingsData, divisionElement) {
	const teamDivisionAbbv = commonUtilities.getTeamDivisionAbbvs()[teamName];
	const teamConferenceAbbv = commonUtilities.getTeamConferenceAbbvs()[teamName];
	const divisionTeams = [];
	for (let i = 0; i < standingsData.length; i++) {
		const standing = standingsData[i];
		if (APIPopupDataUtility.getStandingDivisionAbbrev(standing) === teamDivisionAbbv) {
			divisionTeams.push(standing);
		}
	}
	
	addDivisionLines(divisionTeams, divisionElement);
	
	const conferenceTeams = [];
	for (let i = 0; i < standingsData.length; i++) {
		const standing = standingsData[i];
		if (APIPopupDataUtility.getStandingConferenceAbbrev(standing) === teamConferenceAbbv) {
			conferenceTeams.push(standing);
		}
	}
	
	const wildCardDivision1 = [];
	for (let i = 0; i < conferenceTeams.length; i++) {
		const standing = conferenceTeams[i];
		if (APIPopupDataUtility.getStandingDivisionAbbrev(standing) === teamDivisionAbbv) {
			wildCardDivision1.push(standing);
		}
	}
	
	const wildCardDivision2 = [];
	for (let i = 0; i < conferenceTeams.length; i++) {
		const standing = conferenceTeams[i];
		if (APIPopupDataUtility.getStandingDivisionAbbrev(standing) !== teamDivisionAbbv) {
			wildCardDivision2.push(standing);
		}
	}
	
	addWildCardLines(conferenceTeams, wildCardDivision1, wildCardDivision2);
}

function addDivisionLines(divisionTeams, element) {
	const divisionElement = document.getElementById("division");
	divisionElement.innerHTML = APIPopupDataUtility.getStandingDivisionName(divisionTeams[0]);
	for (let i = 0; i < divisionTeams.length; i++) {
		addStandingsLine(divisionTeams[i], element);
	}
}

function addWildCardLines(conferenceTeams, division1Teams, division2Teams) {
	const wildCardDivision = document.getElementById("wildCardDivision");
	const wildCardDivision2 = document.getElementById("wildCardDivision2");
	wildCardDivision.innerHTML = APIPopupDataUtility.getStandingDivisionName(division1Teams[0]);
	wildCardDivision2.innerHTML = APIPopupDataUtility.getStandingDivisionName(division2Teams[0]);

	const wildCardDivisionLeadersTeamStandings = document.getElementById("wildCardDivisionLeadersTeamStandings");
	const wildCardDivision2LeadersTeamStandings = document.getElementById("wildCardDivision2LeadersTeamStandings");
	const wildCardTop2TeamStandings = document.getElementById("wildCardTop2TeamStandings");
	const wildCardTeamStandings = document.getElementById("wildCardTeamStandings");
	clearElement(wildCardDivisionLeadersTeamStandings);
	clearElement(wildCardDivision2LeadersTeamStandings);
	clearElement(wildCardTop2TeamStandings);
	clearElement(wildCardTeamStandings);

	for (let i = 0; i < division1Teams.length; i++) {
		const team = division1Teams[i];
		if (APIPopupDataUtility.getTeamWildcardSequence(team) === 0) {
			addStandingsLine(team, wildCardDivisionLeadersTeamStandings);
		}
	}
	for (let i = 0; i < division2Teams.length; i++) {
		const team = division2Teams[i];
		if (APIPopupDataUtility.getTeamWildcardSequence(team) === 0) {
			addStandingsLine(team, wildCardDivision2LeadersTeamStandings);
		}
	}

	for (let i = 0; i < conferenceTeams.length; i++) {
		const team = conferenceTeams[i];
		if (APIPopupDataUtility.getTeamWildcardSequence(team) === 0) {
			continue;
		} else if (APIPopupDataUtility.getTeamWildcardSequence(team) === 1) {
			addStandingsLine(team, wildCardTop2TeamStandings);
		} else if (APIPopupDataUtility.getTeamWildcardSequence(team) === 2) {
			addStandingsLine(team, wildCardTop2TeamStandings);
		} else {
			addStandingsLine(team, wildCardTeamStandings);
		}
	}
}

function setConferenceData(standingsData, conferenceElement) {
	const conferenceTeams = [];
	for (let i = 0; i < standingsData.length; i++) {
		const standing = standingsData[i];
		if (APIPopupDataUtility.getStandingConferenceAbbrev(standing) === commonUtilities.getTeamConferenceAbbvs()[teamName]) {
			conferenceTeams.push(standing);
		}
	}
	
	const conferenceTitleElement = document.getElementById("conference");
	conferenceTitleElement.innerHTML = APIPopupDataUtility.getStandingConferenceName(conferenceTeams[0]);
	
	for (let i = 0; i < conferenceTeams.length; i++) {
		addStandingsLine(conferenceTeams[i], conferenceElement);
	}
}

function setLeagueData(standingsData, leagueElement) {
	for (let i = 0; i < standingsData.length; i++) {
		addStandingsLine(standingsData[i], leagueElement);
	}
}

function addStandingsLine(team, element) {
	const statLine = document.createElement("div");
	addClass(statLine, "standingsTeamLine");

	var shortName = commonUtilities.getTeamNameAbbvMapping()[APIPopupDataUtility.getStandingTeamAbbrev(team)];

	const standingsTeam = document.createElement("div");
	addClass(standingsTeam, "standingsTeam");
	const image = document.createElement("img");
	addClass(image, "standingsTeamImage");
	image.src = "logos/" + shortName + ".png";
	const name = document.createElement("div");
	addClass(name, "standingsTeamName");
	name.innerHTML = shortName;
	standingsTeam.appendChild(image);
	standingsTeam.appendChild(name);
	statLine.appendChild(standingsTeam);

	const statsElement = document.createElement("div");
	addClass(statsElement, "stats");

	const games = document.createElement("div");
	addClass(games, "stat");
	games.innerHTML = APIPopupDataUtility.getTeamGamesPlayed(team);
	statsElement.appendChild(games);
	const wins = document.createElement("div");
	addClass(wins, "stat");
	wins.innerHTML = APIPopupDataUtility.getTeamWins(team);
	statsElement.appendChild(wins);
	const losses = document.createElement("div");
	addClass(losses, "stat");
	losses.innerHTML = APIPopupDataUtility.getTeamLosses(team);
	statsElement.appendChild(losses);
	const overtime = document.createElement("div");
	addClass(overtime, "stat");
	overtime.innerHTML = APIPopupDataUtility.getTeamOtLosses(team);
	statsElement.appendChild(overtime);
	const points = document.createElement("div");
	addClass(points, "stat");
	points.innerHTML = APIPopupDataUtility.getTeamPoints(team);
	statsElement.appendChild(points);
	const row = document.createElement("div");
	addClass(row, "stat");
	row.innerHTML = APIPopupDataUtility.getTeamRegulationPlusOtWins(team);
	statsElement.appendChild(row);
	const streak = document.createElement("div");
	addClass(streak, "stat");
	let streakCode = "" + APIPopupDataUtility.getTeamStreakCode(team) + APIPopupDataUtility.getTeamStreakCount(team);
	
	streak.innerHTML = streakCode ? streakCode : "-";
	statsElement.appendChild(streak);

	statLine.appendChild(statsElement);
	element.appendChild(statLine);
}

function getTimeZoneAdjustedTime(dateTime) {
	const timeZone = commonUtilities.getTimeZone();
	var timeInGivenZone = new Date(dateTime.toLocaleString('en-US', {timeZone: timeZone}));
	var hours = parseInt(timeInGivenZone.getHours());
	var minutes = parseInt(timeInGivenZone.getMinutes());
	var pmAm = "AM";
	if (hours >= 12) {
		if (hours > 12) {
			hours -= 12;
		}
		pmAm = "PM";
	}
	if (minutes < 10) {
		minutes = "0" + minutes;
	}

	var localTime = hours + ":" + minutes + pmAm;
	if (localTime[0] == '0') {
		localTime = localTime.substring(1);
	}
	return localTime;
}

function drawAwayLogo(icon) {
	const headingAwayImage = document.getElementById("headingAwayImage");
	headingAwayImage.src = icon;
}

function drawHomeLogo(icon) {
	const headingHomeImage = document.getElementById("headingHomeImage");
	headingHomeImage.src = icon;
}

function setActiveTab(elementToShow, gameStatusToCheck) {
	if (firstOpen && gameStatus == gameStatusToCheck) {
		hideShowElements(elementToShow);
		firstOpen = false;
	}
	if (!firstOpen && gameStatus != gameStatusToCheck) {
		hideShowElements(elementToShow);
	}
}

function hideShowElements(elementToShow) {
	if (calendar === elementToShow) {
		show(calendar);
	} else {
		hide(calendar);
	}

	if (rink === elementToShow) {
		show(rink);
		addClass(liveTab, 'tabSelected');
	} else {
		hide(rink);
		removeClass(liveTab, 'tabSelected');
	}

	if (teamStats === elementToShow) {
		show(teamStats);
		addClass(teamStatsTab, 'tabSelected');
	} else {
		hide(teamStats);
		removeClass(teamStatsTab, 'tabSelected');
	}
	
	if (inGamePlayerStats === elementToShow) {
		show(inGamePlayerStats);
	} else {
		hide(inGamePlayerStats);
	}

	if (playerStats === elementToShow) {
		show(playerStats);
		if (gameStatus === "Preview") {
			addClass(previewTab, 'tabSelected');
		}
	} else {
		hide(playerStats);
		if (gameStatus === "Preview") {
			removeClass(previewTab, 'tabSelected');
		}
	}
	
	if (noGamePlayerStats === elementToShow) {
		show(noGamePlayerStats);
	} else {
		hide(noGamePlayerStats);
	}
	
	if (inGamePlayerStats === elementToShow || playerStats === elementToShow || noGamePlayerStats === elementToShow) {
		addClass(playerStatsTab, 'tabSelected');
	} else {
		removeClass(playerStatsTab, 'tabSelected');
	}

	if (standings === elementToShow) {
		show(standings);
		addClass(standingsTab, 'tabSelected');
	} else {
		hide(standings);
		removeClass(standingsTab, 'tabSelected');
	}
}