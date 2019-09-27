var awayTeamInitial = "";
var currentlyPreGame = true;
var currentGameId = false;
var gameCompleteIconSet = "20000101";
var gameTimeDataRefreshTimer = false;
var homeTeamInitial = "";
var iconCanvas = document.createElement('canvas');
var lossIcon = "logos/loss.png";
var teamId = 0;
var teamIsHome = false;
var teamMenuItems = [];
var teamName = "";
var winIcon = "logos/win.png";

const commonUtilities = CommonUtilities.init();
chrome.alarms.create(
	"NHLScoreTrackerIcon",
	{
		when: Date.now() + 5000,
		periodInMinutes: 60
	}
);

chrome.alarms.onAlarm.addListener(function(alarm) {
	if (alarm.name = "NHLScoreTrackerIcon") {
		commonUtilities.updateData();
		updateGameData();
	}
});

const teams = CommonUtilities.getTeams();
addTeamSelectorMenuOptions();
addTimeZoneMenuOptions();
addBugReportingOption();

function addTeamSelectorMenuOptions() {
	var teamMenuItem = chrome.contextMenus.create({
		"documentUrlPatterns": [window.location.protocol + "//" + window.location.hostname + "/*"],
		"title": "Select Team...",
		"contexts": ["browser_action"],
	});
	
	for (var i = 0, len = teams.length; i < len; i++) {
		var team = teams[i];
		var menuIndex = chrome.contextMenus.create({
			"documentUrlPatterns": [ window.location.protocol + "//" + window.location.hostname + "/*" ],
			"type": "radio",
			"checked": commonUtilities.getTeamName() == team,
			"title": team,
			"parentId": teamMenuItem,
			"contexts": ["browser_action"],
			"onclick": function(info, tab) {
				CommonUtilities.saveSelectedTeam(teamMenuItems[info.menuItemId]);
				updateGameData();
			}
		}, function() {
			if (chrome.runtime.lastError) {
				console.log("error creating menu item:" + chrome.runtime.lastError);
			}
		});
		
		teamMenuItems[menuIndex] = team;
	}
}

function addTimeZoneMenuOptions() {
	const timeZone = commonUtilities.getTimeZone();

	chrome.contextMenus.create({
		"documentUrlPatterns": [ window.location.protocol + "//" + window.location.hostname + "/*" ],
		"type": "separator",
	});
	
	chrome.contextMenus.create({
		"documentUrlPatterns": [ window.location.protocol + "//" + window.location.hostname + "/*" ],
		"type":"radio",
		"checked": timeZone == "US/Central",
		"title":"Central Time",
		"contexts":["browser_action"],
		"onclick":function(info, tab) {
			commonUtilities.saveTimeZone("US/Central");
			updateGameData();
		}
	});
	
	chrome.contextMenus.create({
		"documentUrlPatterns": [ window.location.protocol + "//" + window.location.hostname + "/*" ],
		"type":"radio",
		"checked": timeZone == "US/Eastern",
		"title":"Eastern Time",
		"contexts":["browser_action"],
		"onclick":function(info, tab) {
			commonUtilities.saveTimeZone("US/Eastern");
			updateGameData();
		}
	});
	
	chrome.contextMenus.create({
		"documentUrlPatterns": [ window.location.protocol + "//" + window.location.hostname + "/*" ],
		"type":"radio",
		"checked": timeZone == "US/Mountain",
		"title":"Mountain Time",
		"contexts":["browser_action"],
		"onclick":function(info, tab) {
			commonUtilities.saveTimeZone("US/Mountain");
			updateGameData();
		}
	});
	
	chrome.contextMenus.create({
		"documentUrlPatterns": [ window.location.protocol + "//" + window.location.hostname + "/*" ],
		"type":"radio",
		"checked": timeZone == "US/Pacific",
		"title":"Pacific Time",
		"contexts":["browser_action"],
		"onclick":function(info, tab) {
			commonUtilities.saveTimeZone("US/Pacific");
			updateGameData();
		}
	});
}

function addBugReportingOption() {
	chrome.contextMenus.create({
		"documentUrlPatterns": [ window.location.protocol + "//" + window.location.hostname + "/*" ],
		"type": "separator",
	});

	chrome.contextMenus.create({
		"documentUrlPatterns": [ window.location.protocol + "//" + window.location.hostname + "/*" ],
		"type": "normal",
		"title": "Report a Bug",
		"contexts": ["browser_action"],
		"onclick": function() {
			reportBug();
		}
	});
}

function reportBug() {
	alert("This is still being worked on. For the time being, feel free to email the developer with any bugs or concerns at erickson.russell.j@gmail.com.\n\nThank you for using my extension!");
}

function updateGameData() {
	teamId = commonUtilities.getTeamId();
	teamName = commonUtilities.getTeamName();
	var gameLiveLink = "";
	var localGameTime = false;
	const todayYear = commonUtilities.getTodayYear();
	const todayMonth = commonUtilities.getTodayMonth();
	const todayDay = commonUtilities.getTodayDay();

	const schedulePromise = new Promise(function(resolve, reject) {
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

	schedulePromise.then(
		setScheduleData,
		function(error) {
			setNoGame(teamName);
		},
	);
}

function setScheduleData(scheduleInfo) {
	if (scheduleInfo.dates[0]) {
		if (scheduleInfo.dates[0].games[0]) {
			currentGameId = scheduleInfo.dates[0].games[0].gamePk;
			var dateTime = new Date(scheduleInfo.dates[0].games[0].gameDate);
			localGameTime = getTimeZoneAdjustedTime(dateTime);
			gameLiveLink = scheduleInfo.dates[0].games[0].link;

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
					setNoGame(teamName);
				},
			);
		} else {
			setNoGame(teamName);
		}
	} else {
		setNoGame(teamName);
	}
}

function setGameData(gameInfo) {
	const teamName = commonUtilities.getTeamName();
	var game = gameInfo.gameData;
	teamIsHome = game.teams.home.id === teamId;
	awayTeamInitial = game.teams.away.abbreviation.toLowerCase();
	homeTeamInitial = game.teams.home.abbreviation.toLowerCase();
	
	var tagText = "No " + teamName + " game today.";
	var badgeText = "";
	var icon = commonUtilities.getTeamIcon();
	var gameToday = currentGameId != false;
	
	if (gameToday) {
		var awayScore = gameInfo.liveData.linescore.teams.away.goals;
		var homeScore = gameInfo.liveData.linescore.teams.home.goals;
		var otherTeamName = "other team";
		var goalie = "";
		var venue = game.teams.home.venue.name;
		otherTeamName = teamIsHome ? game.teams.away.teamName : game.teams.home.teamName;
		
		if (game.status.abstractGameState == "Preview") {
			tagText = teamName + " vs " + otherTeamName + " at " + venue + ". Puck drops at " + localGameTime + ".";
			badgeText = localGameTime.substring(0, localGameTime.length - 2);
			currentlyPreGame = true;
		} else if (game.status.abstractGameState == "Final") {
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
			tagText = "The status of the game could not be determined at this time. Please try reselecting your team. If that does not work, please send a bug report to the developer.";
		}
	}
	
	if (tagText) {
		chrome.browserAction.setTitle({title: tagText});
	}
	if (badgeText !== false) {
		chrome.browserAction.setBadgeBackgroundColor({ color: [0, 0, 0, 255] });
		chrome.browserAction.setBadgeText({text: badgeText});
	}
	console.log(badgeText);
	console.log(icon);
	drawLogo(icon, gameToday);
}

function setNoGame(teamName) {
	currentGameId = false;
	chrome.browserAction.setTitle({title: "No " + teamName + " game today."});
	chrome.browserAction.setBadgeText({text: ""});
	drawLogo(commonUtilities.getTeamIcon(), false);
}

function startInGameDataUpdateTimerIfNeeded() {
	if (gameTimeDataRefreshTimer == false) {
		gameTimeDataRefreshTimer = setInterval(updateData, 2000);
	}
}

function updateData() {
	commonUtilities.updateData();
	updateGameData();
}

function getTimeZoneAdjustedTime(dateTime) {
	const timeZone = commonUtilities.getTimeZone();
	var format = "HH:mm";
	var timeInGivenZone = moment(dateTime, format).tz(timeZone).format(format);
	var hours = parseInt(timeInGivenZone.split(':')[0]);
	var minutes = parseInt(timeInGivenZone.split(':')[1]);
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

function drawLogo(logoSource, useColorImage) {
	var context = iconCanvas.getContext('2d');

	var bgImage = new Image();
	bgImage.onload = function() {
	    context.clearRect(0, 0, bgImage.height, bgImage.width);
		context.drawImage(bgImage, 0, 0);
		var imageData = context.getImageData(0, 0, 128, 128);
			
		if(!useColorImage) {
			for(var y = 0; y < imageData.height; y++){
				for(var x = 0; x < imageData.width; x++){
					var i = (y * 4) * imageData.width + x * 4;
					var avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
					imageData.data[i] = avg;
					imageData.data[i + 1] = avg;
					imageData.data[i + 2] = avg;
					if(avg > 0) {
					imageData.data[i + 3] = 100;
					}
				}
			}
	    }
	    
	    chrome.browserAction.setIcon({
		  imageData: imageData
		});
	};

	bgImage.src = logoSource;
}

function getPeriodSuffix(period) {
    const moduloTen = period % 10;
    const moduleHundred = period % 100;

    if (moduloTen == 1 && moduleHundred != 11) {
        return period + "st";
    } else if (moduloTen == 2 && moduleHundred != 12) {
        return period + "nd";
    } else if (moduloTen == 3 && moduleHundred != 13) {
        return period + "rd";
    }

    return period + "th";
}

exports = {addTeamSelectorMenuOptions, addTimeZoneMenuOptions, addBugReportingOption};