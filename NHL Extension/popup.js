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
var previewTab;
var liveTab;
var teamStatsTab;
var playerStatsTab;
var standingsTab;
var activeTab;

// Sections
var rink;
var teamStats;
var inGamePlayerStats;
var playerStats;
var noGamePlayerStats;
var standings;

const commonUtilities = CommonUtilities.init();
chrome.storage.sync.get([ 'trackedTeamName','trackedTimeZone' ], function(result) {
	teamName = result.trackedTeamName;
	teamId = CommonUtilities.getTeamIdMapping()[teamName];
	teamIcon = "logos/" + teamName + ".png";
});
const teams = CommonUtilities.getTeams();
chrome.alarms.create(
	"NHLScoreTrackerPopup",
	{
		when: Date.now(),
		periodInMinutes: 60
	}
);

chrome.alarms.onAlarm.addListener(function(alarm) {
	if (alarm.name = "NHLScoreTrackerPopup") {
		commonUtilities.updateData();

		// const headingRoot = document.getElementById("headingRoot");
		// const tabsRoot = document.getElementById("tabsRoot");
		// const mainSection = document.getElementById("mainSection");
		// addClass(headingRoot, commonUtilities.getTeamColorClass());
		// addClass(tabsRoot, commonUtilities.getTeamColorClass());
		// addClass(mainSection, commonUtilities.getTeamColorClass());

		updateGameData();
	}
});

function updateGameData() {
	previewTab = document.getElementById("previewTab");
	liveTab = document.getElementById("liveTab");
	teamStatsTab = document.getElementById("teamStatsTab");
	playerStatsTab = document.getElementById("playerStatsTab");
	standingsTab = document.getElementById("standingsTab");
	
	rink = document.getElementById("rink");
	teamStats = document.getElementById("gameTeamStats");
	inGamePlayerStats = document.getElementById("inGamePlayerStats");
	playerStats = document.getElementById("playerStats");
	noGamePlayerStats = document.getElementById("noGamePlayerStats");
	standings = document.getElementById("standings");
	
	nhlLink = document.getElementById("nhlLink");
	
	setTabListeners();

	const schedulePromise = new Promise(function(resolve, reject) {
		chrome.storage.sync.get([ 'trackedTeamName','trackedTimeZone' ], function(result) {
			teamName = result.trackedTeamName;
			teamId = CommonUtilities.getTeamIdMapping()[teamName];

			const scheduleXmlHttp = new XMLHttpRequest();
			scheduleXmlHttp.open("GET", "https://statsapi.web.nhl.com/api/v1/schedule?startDate=" + todayYear + "-" + todayMonth + "-" + todayDay + "&endDate=" + todayYear + "-" + todayMonth + "-" + todayDay + "&expand=schedule.teams,schedule.game&site=en_nhl&teamId=" + teamId);

			scheduleXmlHttp.onload = function() {
				if (scheduleXmlHttp.status == 200) {
					resolve(JSON.parse(scheduleXmlHttp.responseText));
				} else {
					reject(Error(scheduleXmlHttp.statusText));
				}
			};

			scheduleXmlHttp.onerror = function() {
				reject(Error("Network Error"));
			};

			scheduleXmlHttp.send();
		});
	});

	schedulePromise.then(
		setScheduleData,
		function(error) {
			setNoGame();
		},
	);
}

function setScheduleData(scheduleInfo) {
	if (scheduleInfo.dates[0]) {
		if (scheduleInfo.dates[0].games[0]) {
			currentGameId = scheduleInfo.dates[0].games[0].gamePk;
			var gameLiveLink = scheduleInfo.dates[0].games[0].link;

			const gamePromise = new Promise(function(resolve, reject) {
				const gameXmlHttp = new XMLHttpRequest();
				gameXmlHttp.open("GET", "https://statsapi.web.nhl.com/" + gameLiveLink);

				gameXmlHttp.onload = function() {
					if (gameXmlHttp.status == 200) {
						resolve(JSON.parse(gameXmlHttp.responseText));
					} else {
						reject(Error(scheduleXmlHttp.statusText));
					}
				};

				gameXmlHttp.onerror = function() {
					reject(Error("Network Error"));
				};

				gameXmlHttp.send();
			});

			gamePromise.then(
				setGameData,
				function(error) {
					setNoGame();
				},
			);
		} else {
			gameStatus = "None";
			currentGameId = false;
			setFooterLinkHref("none", "", "", "");
			setNoGame();
		}
	} else {
		gameStatus = "None";
		currentGameId = false;
		setFooterLinkHref("none", "", "", "");
		setNoGame();
	}
}

function setGameData(gameInfo) {
	const game = gameInfo.gameData;
	const teamIsHome = game.teams.home.id === teamId;
	const gameToday = currentGameId != false;
	
	if (gameToday) {
		awayScore = gameInfo.liveData.linescore.teams.away.goals;
		homeScore = gameInfo.liveData.linescore.teams.home.goals;
		otherTeamName = teamIsHome ? game.teams.away.teamName : game.teams.home.teamName;
		const awayTeamInitial = game.teams.away.abbreviation.toLowerCase();
		const homeTeamInitial = game.teams.home.abbreviation.toLowerCase();
		
		if (teamIsHome) {
			awayTeamIcon = "logos/" + otherTeamName + ".png";
			homeTeamIcon = teamIcon;

			awayTeamId = CommonUtilities.getTeamIdMapping()[otherTeamName];
			homeTeamId = teamId;

			awayTeamName = otherTeamName;
			homeTeamName = teamName;

			drawAwayLogo("logos/" + otherTeamName + ".png");
			drawHomeLogo(teamIcon);
		} else {
			awayTeamIcon = teamIcon;
			homeTeamIcon = "logos/" + otherTeamName + ".png";

			awayTeamId = teamId;
			homeTeamId = CommonUtilities.getTeamIdMapping()[otherTeamName];

			awayTeamName = teamName;
			homeTeamName = otherTeamName;

			drawAwayLogo(teamIcon);
			drawHomeLogo("logos/" + otherTeamName + ".png");
		}
		
		if (game.status.abstractGameState == "Preview") {
			gameStatus = "Preview";
			setFooterLinkHref("preview", currentGameId, awayTeamInitial, homeTeamInitial);
			setPreview(gameInfo);
			currentlyPreGame = true;
		} else if (game.status.abstractGameState == "Final") {
			gameStatus = "Final";
			setFooterLinkHref("final", currentGameId, awayTeamInitial, homeTeamInitial);
			setFinal(gameInfo);
			currentlyPreGame = false;
		} else if (game.status.abstractGameState == "Live") {
			gameStatus = "Live";
			setFooterLinkHref("live", currentGameId, awayTeamInitial, homeTeamInitial);
			setLive(gameInfo);
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
	commonUtilities.updateData();
	updateGameData(todayYear, todayMonth, todayDay);
}

function setTabListeners() {
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
	setRinkSection(gameInfo);
	hide(previewTab);
	show(liveTab);
	show(teamStatsTab);
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
		window.clearInterval(gameTimeDataRefreshTimer);
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

	setActiveTab(noGamePlayerStats, "None");
}

function setHeadingSection(gameInfo, gameStatus) {
	const headingAwayScore = document.getElementById("awayScore");
	const timeLeft = document.getElementById("time");
	const headingHomeScore = document.getElementById("homeScore");

	switch(gameStatus) {
		case "preview":
			drawAwayLogo(awayTeamIcon);
			drawHomeLogo(homeTeamIcon);
			var dateTime = new Date(gameInfo.gameData.datetime.dateTime);
			timeLeft.innerHTML = "Puck Drop: " + getTimeZoneAdjustedTime(dateTime);
			headingAwayScore.innerHTML = "";
			headingHomeScore.innerHTML = "";
			break;
		case "live":
			drawAwayLogo(awayTeamIcon);
			drawHomeLogo(homeTeamIcon);
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
	const awayOnIce = gameInfo.liveData.boxscore.teams.away.onIce;
	const homeOnIce = gameInfo.liveData.boxscore.teams.home.onIce;

	if(awayTeamOnIce !== awayOnIce) {
		const awayTeamPlayers = gameInfo.liveData.boxscore.teams.away.players;
		for(var i = 0; i < awayOnIce.length; i++) {
			const player = awayTeamPlayers['ID' + awayOnIce[i]];
			switch(player.position.abbreviation) {
				case "RW":
				case "C":
				case "LW":
					if (awayTeamOffense.length < 3) {
						awayTeamOffense.push(awayOnIce[i]);
						if (awayTeamOffense.length === 0) {
							awayLeftWing.innerHTML = player.jerseyNumber;
							awayLeftWing.setAttribute('title', player.person.fullName);
						} else if (awayTeamOffense.length === 1) {
							awayCenter.innerHTML = player.jerseyNumber;
							awayCenter.setAttribute('title', player.person.fullName);
						} else if (awayTeamOffense.length === 2) {
							awayRightWing.innerHTML = player.jerseyNumber;
							awayRightWing.setAttribute('title', player.person.fullName);
						}
					} else {
						if (!awayOnIce.includes(awayTeamOffense[0])) {
							awayTeamOffense = [awayOnIce[i], awayTeamOffense[1], awayTeamOffense[2]];
							awayLeftWing.innerHTML = player.jerseyNumber;
							awayLeftWing.setAttribute('title', player.person.fullName);
						} else if (!awayOnIce.includes(awayTeamOffense[1])) {
							awayTeamOffense = [awayTeamOffense[0], awayOnIce[i], awayTeamOffense[2]];
							awayCenter.innerHTML = player.jerseyNumber;
							awayCenter.setAttribute('title', player.person.fullName);
						} else if (!awayOnIce.includes(awayTeamOffense[2])) {
							awayTeamOffense = [awayTeamOffense[0], awayTeamOffense[1], awayOnIce[i]];
							awayRightWing.innerHTML = player.jerseyNumber;
							awayRightWing.setAttribute('title', player.person.fullName);
						}
					}
					break;
				case "D":
					if(awayTeamDefense.length === 0) {
						awayTeamDefense.push(awayOnIce[i]);
						awayLeftDefense.innerHTML = player.jerseyNumber;
						awayLeftDefense.setAttribute('title', player.person.fullName);
					} else if (awayTeamDefense.length === 1) {
						awayTeamDefense.push(awayOnIce[i]);
						awayRightDefense.innerHTML = player.jerseyNumber;
						awayRightDefense.setAttribute('title', player.person.fullName);
					} else {
						if (!awayOnIce.includes(awayTeamDefense[0])) {
							awayTeamDefense = [awayOnIce[i], awayTeamDefense[1]];
							awayLeftDefense.innerHTML = player.jerseyNumber;
							awayLeftDefense.setAttribute('title', player.person.fullName);
						} else if (!awayOnIce.includes(awayTeamDefense[1])) {
							awayTeamDefense = [awayTeamDefense[0], awayOnIce[i]];
							awayRightDefense.innerHTML = player.jerseyNumber;
							awayRightDefense.setAttribute('title', player.person.fullName);
						}
					}
					break;
				case "G":
					if (awayGoalie.innerHTML !== player.jerseyNumber) {
						awayGoalie.innerHTML = player.jerseyNumber;
						awayGoalie.setAttribute('title', player.person.fullName);
					}
					break;
			}
		}
		
		awayTeamOnIce = awayOnIce;
	}
	
	if(homeTeamOnIce !== homeOnIce) {
		const homeTeamPlayers = gameInfo.liveData.boxscore.teams.home.players;
		for(var i = 0; i < homeOnIce.length; i++) {
			const player = homeTeamPlayers['ID' + homeOnIce[i]];
			
			switch(player.position.abbreviation) {
				case "RW":
				case "C":
				case "LW":
					if (homeTeamOffense.length < 3) {
						homeTeamOffense.push(homeOnIce[i]);
						if (homeTeamOffense.length === 0) {
							homeLeftWing.innerHTML = player.jerseyNumber;
							homeLeftWing.setAttribute('title', player.person.fullName);
						} else if (homeTeamOffense.length === 1) {
							homeCenter.innerHTML = player.jerseyNumber;
							homeCenter.setAttribute('title', player.person.fullName);
						} else if (homeTeamOffense.length === 2) {
							homeRightWing.innerHTML = player.jerseyNumber;
							homeRightWing.setAttribute('title', player.person.fullName);
						}
					} else {
						if (!homeOnIce.includes(homeTeamOffense[0])) {
							homeTeamOffense = [homeOnIce[i], homeTeamOffense[1], homeTeamOffense[2]];
							homeLeftWing.innerHTML = player.jerseyNumber;
							homeLeftWing.setAttribute('title', player.person.fullName);
						} else if (!homeOnIce.includes(homeTeamOffense[1])) {
							homeTeamOffense = [homeTeamOffense[0], homeOnIce[i], homeTeamOffense[2]];
							homeCenter.innerHTML = player.jerseyNumber;
							homeCenter.setAttribute('title', player.person.fullName);
						} else if (!homeOnIce.includes(homeTeamOffense[2])) {
							homeTeamOffense = [homeTeamOffense[0], homeTeamOffense[1], homeOnIce[i]];
							homeRightWing.innerHTML = player.jerseyNumber;
							homeRightWing.setAttribute('title', player.person.fullName);
						}
					}
					break;
				case "D":
					if(homeTeamDefense.length === 0) {
						homeTeamDefense.push(homeOnIce[i]);
						homeLeftDefense.innerHTML = player.jerseyNumber;
						homeLeftDefense.setAttribute('title', player.person.fullName);
					} else if (homeTeamDefense.length === 1) {
						homeTeamDefense.push(homeOnIce[i]);
						homeRightDefense.innerHTML = player.jerseyNumber;
						homeRightDefense.setAttribute('title', player.person.fullName);
					} else {
						if (!homeOnIce.includes(homeTeamDefense[0])) {
							homeTeamDefense = [homeOnIce[i], homeTeamDefense[1]];
							homeLeftDefense.innerHTML = player.jerseyNumber;
							homeLeftDefense.setAttribute('title', player.person.fullName);
						} else if (!homeOnIce.includes(homeTeamDefense[1])) {
							homeTeamDefense = [homeTeamDefense[0], homeOnIce[i]];
							homeRightDefense.innerHTML = player.jerseyNumber;
							homeRightDefense.setAttribute('title', player.person.fullName);
						}
					}
					break;
				case "G":
					if (homeGoalie.innerHTML !== player.jerseyNumber) {
						homeGoalie.innerHTML = player.jerseyNumber;
						homeGoalie.setAttribute('title', player.person.fullName);
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
	console.log(awayTeamStats);
	
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

		const awayTeamForwards = document.getElementById("awayTeamForwards");
		const awayTeamDefense = document.getElementById("awayTeamDefense");
		const awayTeamGoalies = document.getElementById("awayTeamGoalies");
		clearElement(awayTeamForwards);
		clearElement(awayTeamDefense);
		clearElement(awayTeamGoalies);

		const homeTeamForwards = document.getElementById("homeTeamForwards");
		const homeTeamDefense = document.getElementById("homeTeamDefense");
		const homeTeamGoalies = document.getElementById("homeTeamGoalies");
		clearElement(homeTeamForwards);
		clearElement(homeTeamDefense);
		clearElement(homeTeamGoalies);

		const awayPlayersPromise = getNonLivePlayersPromises(awayTeamId);
		awayPlayersPromise.then(function(awayPlayersPromise) {
			Promise.all(awayPlayersPromise[0]).then(function(awayPlayerPromises) {
				Promise.all(awayPlayerPromises).then(function(players) {
					for (var i = 0; i < players.length; i++) {
						const player = players[i];
						switch(player.people[0].primaryPosition.type) {
							case "Defenseman":
								addPlayerStat(player, awayTeamDefense);
								break;
							case "Forward":
								addPlayerStat(player, awayTeamForwards);
								break;
							case "Goalie":
								addPlayerStat(player, awayTeamGoalies, true);
								break;
						}
					}
				});
			});
		});

		const homePlayersPromise = getNonLivePlayersPromises(homeTeamId);
		homePlayersPromise.then(function(homePlayersPromise) {
			Promise.all(homePlayersPromise[0]).then(function(homePlayerPromises) {
				Promise.all(homePlayerPromises).then(function(players) {
					for (var i = 0; i < players.length; i++) {
						const player = players[i];
						switch(player.people[0].primaryPosition.type) {
							case "Defenseman":
								addPlayerStat(player, homeTeamDefense);
								break;
							case "Forward":
								addPlayerStat(player, homeTeamForwards);
								break;
							case "Goalie":
								addPlayerStat(player, homeTeamGoalies, true);
								break;
						}
					}
				});
			});
		});
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
		
		const awayTeamPlayers = gameInfo.liveData.boxscore.teams.away.players;
		const homeTeamPlayers = gameInfo.liveData.boxscore.teams.home.players;

		for(const playerID in awayTeamPlayers) {
			const player = awayTeamPlayers[playerID];
			switch(player.position.type) {
				case "Defenseman":
					addInGamePlayerStat(player, inGameAwayTeamDefense);
					break;
				case "Forward":
					addInGamePlayerStat(player, inGameAwayTeamForwards);
					break;
				case "Goalie":
					addInGamePlayerStat(player, inGameAwayTeamGoalies, true);
					break;
			}
		}
		
		for(const playerID in homeTeamPlayers) {
			const player = homeTeamPlayers[playerID];
			switch(player.position.type) {
				case "Defenseman":
					addInGamePlayerStat(player, inGameHomeTeamDefense);
					break;
				case "Forward":
					addInGamePlayerStat(player, inGameHomeTeamForwards);
					break;
				case "Goalie":
					addInGamePlayerStat(player, inGameHomeTeamGoalies, true);
					break;
			}
		}
	} else {
		const noGamePlayerStatsTeamName = document.getElementById("noGamePlayerStatsTeamName");
		noGamePlayerStatsTeamName.innerHTML = teamName;

		const noGamePlayerStats = document.getElementById("noGamePlayerStats");
		const teamForwards = document.getElementById("noGameForwards");
		const teamDefense = document.getElementById("noGameDefense");
		const teamGoalies = document.getElementById("noGameGoalies");
		clearElement(teamForwards);
		clearElement(teamDefense);
		clearElement(teamGoalies);

		const playersPromise = getNonLivePlayersPromises(teamId);
		playersPromise.then(function(playersPromise) {
			Promise.all(playersPromise[0]).then(function(playerPromises) {
				Promise.all(playerPromises).then(function(players) {
					for (var i = 0; i < players.length; i++) {
						const player = players[i];
						switch(player.people[0].primaryPosition.type) {
							case "Defenseman":
								addPlayerStat(player, teamDefense);
								break;
							case "Forward":
								addPlayerStat(player, teamForwards);
								break;
							case "Goalie":
								addPlayerStat(player, teamGoalies, true);
								break;
						}
					}
				});
			});
		});
	}
}

function getNonLivePlayersPromises(team) {
	const teamPromise = getTeamDataPromise(team);
	return getPlayersDataPromises(teamPromise);
}

function getTeamDataPromise(team) {
	return new Promise(function(resolve, reject) {
		var teamXmlHttp = new XMLHttpRequest();
		teamXmlHttp.open("GET", "https://statsapi.web.nhl.com/api/v1/teams/" + team + "/roster");

		teamXmlHttp.onload = function() {
			if (teamXmlHttp.status == 200) {
				resolve(JSON.parse(teamXmlHttp.responseText));
			} else {
				reject(Error(teamXmlHttp.statusText));
			}
		};

		teamXmlHttp.onerror = function() {
			reject(Error("Network Error"));
		};

		teamXmlHttp.send();
	});

	return teamPromise.then(
		function(teamInfo) {
			return teamInfo;
		},
		function(error) {
			return null;
		},
	);
}

function getPlayersDataPromises(teamPromise) {
	return teamPromise.then(function(teamInfo) {
		const roster = teamInfo.roster;

		promises = roster.map(player => {
			return new Promise(function(resolve, reject) {
				var playerXmlHttp = new XMLHttpRequest();
				playerXmlHttp.open("GET", "https://statsapi.web.nhl.com" + player.person.link + "?hydrate=stats(splits=statsSingleSeason)");

				playerXmlHttp.onload = function() {
					if (playerXmlHttp.status == 200) {
						resolve(JSON.parse(playerXmlHttp.responseText));
					} else {
						reject(Error(playerXmlHttp.responseText));
					}
				};

				playerXmlHttp.onerror = function() {
					reject(Error(playerXmlHttp.statustext));
				};

				playerXmlHttp.send();
			});
		});

		return Promise.all([promises]).then(function(playersInfo) {
		  return playersInfo;
		}, function() {
		  return null;
		});
	});
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

	const divisionTeamStandings = document.getElementById("divisionTeamStandings");
	const conferenceTeamStandings = document.getElementById("conferenceTeamStandings");
	const leagueTeamStandings = document.getElementById("leagueTeamStandings");
	clearElement(divisionTeamStandings);
	clearElement(conferenceTeamStandings);
	clearElement(leagueTeamStandings);

	setDivisionData(divisionTeamStandings);
	setConferenceData(conferenceTeamStandings);
	setLeagueData(leagueTeamStandings);
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
	const playerName = player.person.fullName.split(" ");
	const statLine = document.createElement("div");
	addClass(statLine, "playerStatsLine");

	const nameNumber = document.createElement("div");
	addClass(nameNumber, "nameNumber");
	const number = document.createElement("div");
	addClass(number, "number");
	number.innerHTML = player.jerseyNumber;
	const name = document.createElement("div");
	addClass(name, "name");
	name.innerHTML = playerName[playerName.length - 1];
	nameNumber.appendChild(number);
	nameNumber.appendChild(name);
	statLine.appendChild(nameNumber);

	const stats = document.createElement("div");
	addClass(stats, "stats");

	if (player.stats) {
		if (!isGoalie) {
			const shots = document.createElement("div");
			addClass(shots, "stat");
			shots.innerHTML = player.stats.skaterStats.shots;
			stats.appendChild(shots);
			const goals = document.createElement("div");
			addClass(goals, "stat");
			goals.innerHTML = player.stats.skaterStats.goals;
			stats.appendChild(goals);
			const assists = document.createElement("div");
			addClass(assists, "stat");
			assists.innerHTML = player.stats.skaterStats.assists;
			stats.appendChild(assists);
			const points = document.createElement("div");
			addClass(points, "stat");
			points.innerHTML = player.stats.skaterStats.assists + player.stats.skaterStats.goals;
			stats.appendChild(points);
			const plusMinus = document.createElement("div");
			addClass(plusMinus, "stat");
			plusMinus.innerHTML = player.stats.skaterStats.plusMinus;
			stats.appendChild(plusMinus);
			const penaltyMinutes = document.createElement("div");
			addClass(penaltyMinutes, "stat");
			const penaltyMinutesStat = player.stats.skaterStats.penaltyMinutes;
			penaltyMinutes.innerHTML =  penaltyMinutesStat ? penaltyMinutesStat : 0;
			stats.appendChild(penaltyMinutes);
			const powerPlay = document.createElement("div");
			addClass(powerPlay, "stat");
			powerPlay.innerHTML = player.stats.skaterStats.powerPlayGoals;
			stats.appendChild(powerPlay);
			const shortHanded = document.createElement("div");
			addClass(shortHanded, "stat");
			shortHanded.innerHTML = player.stats.skaterStats.shortHandedGoals;
			stats.appendChild(shortHanded);
		} else {
			const evenShotsAgainst = document.createElement("div");
			addClass(evenShotsAgainst, "stat");
			evenShotsAgainst.innerHTML = player.stats.goalieStats.evenShotsAgainst;
			stats.appendChild(evenShotsAgainst);
			const powerPlayShotsAgainst = document.createElement("div");
			addClass(powerPlayShotsAgainst, "stat");
			powerPlayShotsAgainst.innerHTML = player.stats.goalieStats.powerPlayShotsAgainst;
			stats.appendChild(powerPlayShotsAgainst);
			const shortHandedShotsAgainst = document.createElement("div");
			addClass(shortHandedShotsAgainst, "stat");
			shortHandedShotsAgainst.innerHTML = player.stats.goalieStats.shortHandedShotsAgainst;
			stats.appendChild(shortHandedShotsAgainst);
			const savesShotsAgainst = document.createElement("div");
			addClass(savesShotsAgainst, "stat");
			addClass(savesShotsAgainst, "savesShots");
			savesShotsAgainst.innerHTML = player.stats.goalieStats.saves + "-" + player.stats.goalieStats.shots;
			stats.appendChild(savesShotsAgainst);
			const savePercent = document.createElement("div");
			addClass(savePercent, "stat");
			let savePercentText = Number(player.stats.goalieStats.savePercentage);
			savePercentText = savePercentText ? savePercentText : 0;
			savePercent.innerHTML = savePercentText.toFixed(2) + "%";
			stats.appendChild(savePercent);
			const penaltyMinutes = document.createElement("div");
			addClass(penaltyMinutes, "stat");
			const penaltyMinutesStat = player.stats.goalieStats.pim;
			penaltyMinutes.innerHTML = penaltyMinutesStat ? penaltyMinutesStat : 0;
			stats.appendChild(penaltyMinutes);
			const timeOnIce = document.createElement("div");
			addClass(timeOnIce, "stat");
			timeOnIce.innerHTML = player.stats.goalieStats.timeOnIce;
			stats.appendChild(timeOnIce);
		}
	}

	statLine.appendChild(stats);
	element.appendChild(statLine);
}

function addPlayerStat(player, element, isGoalie = false) {
	const person = player.people[0];
	const position = person.primaryPosition;
	var stats = person.stats[0].splits;
	if (stats.length == 0) {
		return;
	}
	stats = stats[0].stat;

	const playerName = person.lastName;
	const statLine = document.createElement("div");
	addClass(statLine, "playerStatsLine");

	const nameNumber = document.createElement("div");
	addClass(nameNumber, "nameNumber");
	const number = document.createElement("div");
	addClass(number, "number");
	number.innerHTML = person.primaryNumber;
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
		games.innerHTML = stats.games;
		statsElement.appendChild(games);
		const goals = document.createElement("div");
		addClass(goals, "stat");
		goals.innerHTML = stats.goals;
		statsElement.appendChild(goals);
		const assists = document.createElement("div");
		addClass(assists, "stat");
		assists.innerHTML = stats.assists;
		statsElement.appendChild(assists);
		const points = document.createElement("div");
		addClass(points, "stat");
		points.innerHTML = stats.assists + stats.goals;
		statsElement.appendChild(points);
		const plusMinus = document.createElement("div");
		addClass(plusMinus, "stat");
		plusMinus.innerHTML = stats.plusMinus;
		statsElement.appendChild(plusMinus);
		const penaltyMinutes = document.createElement("div");
		addClass(penaltyMinutes, "stat");
		const penaltyMinutesStat = stats.penaltyMinutes;
		penaltyMinutes.innerHTML = penaltyMinutesStat ? penaltyMinutesStat : 0;
		statsElement.appendChild(penaltyMinutes);
		const powerPlay = document.createElement("div");
		addClass(powerPlay, "stat");
		powerPlay.innerHTML = stats.powerPlayGoals;
		statsElement.appendChild(powerPlay);
		const gameWinning = document.createElement("div");
		addClass(gameWinning, "stat");
		gameWinning.innerHTML = stats.gameWinningGoals;
		statsElement.appendChild(gameWinning);
	} else {
		const games = document.createElement("div");
		addClass(games, "stat");
		games.innerHTML = stats.games;
		statsElement.appendChild(games);
		const wins = document.createElement("div");
		addClass(wins, "stat");
		wins.innerHTML = stats.wins;
		statsElement.appendChild(wins);
		const losses = document.createElement("div");
		addClass(losses, "stat");
		losses.innerHTML = stats.losses;
		statsElement.appendChild(losses);
		const shotsAgainst = document.createElement("div");
		addClass(shotsAgainst, "stat");
		shotsAgainst.innerHTML = stats.shotsAgainst;
		statsElement.appendChild(shotsAgainst);
		const goalsAgainst = document.createElement("div");
		addClass(goalsAgainst, "stat");
		goalsAgainst.innerHTML = stats.goalsAgainst;
		statsElement.appendChild(goalsAgainst);
		const goalAgainstAverage = document.createElement("div");
		addClass(goalAgainstAverage, "stat");
		goalAgainstAverage.innerHTML = stats.goalAgainstAverage;
		statsElement.appendChild(goalAgainstAverage);
		const savePercent = document.createElement("div");
		addClass(savePercent, "stat");
		let savePercentText = Number(stats.savePercentage) * 100;
		savePercentText = savePercentText ? savePercentText : 0;
		savePercent.innerHTML = savePercentText.toFixed(2) + "%";
		statsElement.appendChild(savePercent);
		const shutouts = document.createElement("div");
		addClass(shutouts, "stat");
		shutouts.innerHTML = stats.shutouts;
		statsElement.appendChild(shutouts);
	}

	statLine.appendChild(statsElement);
	element.appendChild(statLine);
}

function setDivisionData(divisionElement) {
	const divisionPromise = new Promise(function(resolve, reject) {
		var divisionXmlHttp = new XMLHttpRequest();
		divisionXmlHttp.open("GET", "https://statsapi.web.nhl.com/api/v1/standings/byDivision");

		divisionXmlHttp.onload = function() {
			if (divisionXmlHttp.status == 200) {
				resolve(JSON.parse(divisionXmlHttp.responseText));
			} else {
				reject(Error(divisionXmlHttp.statusText));
			}
		};

		divisionXmlHttp.onerror = function() {
			reject(Error("Network Error"));
		};

		divisionXmlHttp.send();
	});

	divisionPromise.then(
		function(divisionInfo) {
			const divisions = divisionInfo.records;
			const wildCardDivisions = [];
			for (var i = 0; i < divisions.length; i++) {
				if (divisions[i].division.id == commonUtilities.getTeamDivisionId()) {
					addDivisionLines(divisions[i], divisionElement);
				}
				if (divisions[i].conference.id == commonUtilities.getTeamConferenceId()) {
					wildCardDivisions.push(divisions[i]);
					if (wildCardDivisions.length == 2) {
						addWildCardLines(wildCardDivisions[0], wildCardDivisions[1]);
					}
				}
			}
		},
		function(error) {
			return null;
		},
	);
}

function addDivisionLines(division, element) {
	const divisionElement = document.getElementById("division");
	divisionElement.innerHTML = division.division.name;
	const teams = division.teamRecords;
	for (let i = 0; i < teams.length; i++) {
		addStandingsLine(teams[i], element);
	}
}

function addWildCardLines(division1, division2) {
	const wildCardDivision = document.getElementById("wildCardDivision");
	const wildCardDivision2 = document.getElementById("wildCardDivision2");
	wildCardDivision.innerHTML = division1.division.name;
	wildCardDivision2.innerHTML = division2.division.name;

	const wildCardDivisionLeadersTeamStandings = document.getElementById("wildCardDivisionLeadersTeamStandings");
	const wildCardDivision2LeadersTeamStandings = document.getElementById("wildCardDivision2LeadersTeamStandings");
	const wildCardTop2TeamStandings = document.getElementById("wildCardTop2TeamStandings");
	const wildCardTeamStandings = document.getElementById("wildCardTeamStandings");
	clearElement(wildCardDivisionLeadersTeamStandings);
	clearElement(wildCardDivision2LeadersTeamStandings);
	clearElement(wildCardTop2TeamStandings);
	clearElement(wildCardTeamStandings);

	const teams1 = division1.teamRecords;
	const teams2 = division2.teamRecords;
	for (let i = 0; i < teams1.length; i++) {
		if (teams1[i].wildCardRank === "0") {
			addStandingsLine(teams1[i], wildCardDivisionLeadersTeamStandings);
		}
	}
	for (let i = 0; i < teams2.length; i++) {
		if (teams2[i].wildCardRank === "0") {
			addStandingsLine(teams2[i], wildCardDivision2LeadersTeamStandings);
		}
	}

	const wildCardPromise = new Promise(function(resolve, reject) {
		var wildCardXmlHttp = new XMLHttpRequest();
		wildCardXmlHttp.open("GET", "https://statsapi.web.nhl.com/api/v1/standings/wildCard");

		wildCardXmlHttp.onload = function() {
			if (wildCardXmlHttp.status == 200) {
				resolve(JSON.parse(wildCardXmlHttp.responseText));
			} else {
				reject(Error(wildCardXmlHttp.statusText));
			}
		};

		wildCardXmlHttp.onerror = function() {
			reject(Error("Network Error"));
		};

		wildCardXmlHttp.send();
	});

	wildCardPromise.then(
		function(wildCardInfo) {
			const wildCard = wildCardInfo.records;
			for (let i = 0; i < wildCard.length; i++) {
				if (wildCard[i].conference.id == commonUtilities.getTeamConferenceId()) {
					const teams = wildCard[i].teamRecords;
					for (let j = 0; j < teams.length; j++) {
						if (teams[j].wildCardRank === "1") {
							addStandingsLine(teams[j], wildCardTop2TeamStandings);
						} else if (teams[j].wildCardRank === "2") {
							addStandingsLine(teams[j], wildCardTop2TeamStandings);
						} else {
							addStandingsLine(teams[j], wildCardTeamStandings);
						}
					}
				}
			}
		},
		function(error) {
			return null;
		},
	);
}

function setConferenceData(conferenceElement) {
	const conferencePromise = new Promise(function(resolve, reject) {
		var conferenceXmlHttp = new XMLHttpRequest();
		conferenceXmlHttp.open("GET", "https://statsapi.web.nhl.com/api/v1/standings/byConference");

		conferenceXmlHttp.onload = function() {
			if (conferenceXmlHttp.status == 200) {
				resolve(JSON.parse(conferenceXmlHttp.responseText));
			} else {
				reject(Error(conferenceXmlHttp.statusText));
			}
		};

		conferenceXmlHttp.onerror = function() {
			reject(Error("Network Error"));
		};

		conferenceXmlHttp.send();
	});

	conferencePromise.then(
		function(conferenceInfo) {
			const conferences = conferenceInfo.records;
			for (var i = 0; i < conferences.length; i++) {
				if (conferences[i].conference.id == commonUtilities.getTeamConferenceId()) {
					addConferenceLines(conferences[i], conferenceElement);
				}
			}
		},
		function(error) {
			return null;
		},
	);
}

function addConferenceLines(conference, element) {
	const conferenceElement = document.getElementById("conference");
	conferenceElement.innerHTML = conference.conference.name;

	let teams = conference.teamRecords;
	for (let j = 0; j < teams.length; j++) {
		addStandingsLine(teams[j], element);
	}
}

function setLeagueData(leagueElement) {
	const leaguePromise = new Promise(function(resolve, reject) {
		var leagueXmlHttp = new XMLHttpRequest();
		leagueXmlHttp.open("GET", "https://statsapi.web.nhl.com/api/v1/standings/byLeague");

		leagueXmlHttp.onload = function() {
			if (leagueXmlHttp.status == 200) {
				resolve(JSON.parse(leagueXmlHttp.responseText));
			} else {
				reject(Error(leagueXmlHttp.statusText));
			}
		};

		leagueXmlHttp.onerror = function() {
			reject(Error("Network Error"));
		};

		leagueXmlHttp.send();
	});

	leaguePromise.then(
		function(leagueInfo) {
			const leagueRecords = leagueInfo.records;
			addLeagueLines(leagueRecords[0], leagueElement);
		},
		function(error) {
			return null;
		},
	);
}

function addLeagueLines(league, element) {
	let teams = league.teamRecords;
	for (let j = 0; j < teams.length; j++) {
		addStandingsLine(teams[j], element);
	}
}

function addStandingsLine(team, element) {
	const statLine = document.createElement("div");
	addClass(statLine, "standingsTeamLine");

	var shortName = CommonUtilities.getTeamNameIdMapping()[team.team.id];

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
	games.innerHTML = team.gamesPlayed;
	statsElement.appendChild(games);
	const wins = document.createElement("div");
	addClass(wins, "stat");
	wins.innerHTML = team.leagueRecord.wins;
	statsElement.appendChild(wins);
	const losses = document.createElement("div");
	addClass(losses, "stat");
	losses.innerHTML = team.leagueRecord.losses;
	statsElement.appendChild(losses);
	const overtime = document.createElement("div");
	addClass(overtime, "stat");
	overtime.innerHTML = team.leagueRecord.ot;
	statsElement.appendChild(overtime);
	const points = document.createElement("div");
	addClass(points, "stat");
	points.innerHTML = team.points;
	statsElement.appendChild(points);
	const row = document.createElement("div");
	addClass(row, "stat");
	row.innerHTML = team.row;
	statsElement.appendChild(row);
	const streak = document.createElement("div");
	addClass(streak, "stat");
	streak.innerHTML = team.streak.streakCode;
	statsElement.appendChild(streak);

	statLine.appendChild(statsElement);
	element.appendChild(statLine);
}

function getTimeZoneAdjustedTime(dateTime) {
	const timeZone = commonUtilities.getTimeZone();
	var format = "HH:mm";
	var timeInGivenZone = moment(dateTime, format).tz(timeZone).format(format);
	var hours = parseInt(timeInGivenZone.split(':')[0]);
	var minutes = parseInt(timeInGivenZone.split(':')[1]);
	var pmAm = " AM";
	if (hours >= 12) {
		if (hours > 12) {
			hours -= 12;
		}
		pmAm = " PM";
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