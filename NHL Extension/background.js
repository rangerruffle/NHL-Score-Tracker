import CommonUtilities from "./CommonUtilities.js";
import APIDataUtility from "./APIDataUtility.js";
import APICallsUtility from "./APICallsUtility.js";
import APIGameStates from "./APIGameStates.js";

var awayTeamInitial = "";
var currentlyPreGame = true;
var currentGameId = false;
var gameCompleteIconSet = "20000101";
var gameTimeDataRefreshTimer = false;
var homeTeamInitial = "";
var iconCanvas = new OffscreenCanvas(128, 128)
var lossIcon = "logos/loss.png";
var teamId = 0;
var teamAbbv = "";
var teamIsHome = false;
var teamName = "";
var winIcon = "logos/win.png";
var localGameTime = false;

let commonUtilities = CommonUtilities.init();
let teams = commonUtilities.getTeams();
chrome.alarms.create(
	"NHLScoreTrackerIcon",
	{
		when: Date.now() + 5000,
		periodInMinutes: 60
	}
);

chrome.alarms.onAlarm.addListener(function(alarm) {
	if (alarm.name = "NHLScoreTrackerIcon") {
		if (!commonUtilities.getTeamAbbv()) {
			commonUtilities = CommonUtilities.init();
			teams = commonUtilities.getTeams();
		}
		
		commonUtilities.updateData();
		updateGameData();
	}
});

chrome.runtime.onInstalled.addListener(() => {
	addTeamSelectorMenuOptions();
	addTimeZoneMenuOptions();
	addTeamColorMenuOption();
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
	if (!commonUtilities.getTeamAbbv()) {
		commonUtilities = CommonUtilities.init();
		teams = commonUtilities.getTeams();
	}
		
	if (info.menuItemId === "timeZoneSelectorCentral") {
		commonUtilities.saveTimeZone("US/Central");
	} else if (info.menuItemId === "timeZoneSelectorEastern") {
		commonUtilities.saveTimeZone("US/Eastern");
	} else if (info.menuItemId === "timeZoneSelectorMountain") {
		commonUtilities.saveTimeZone("US/Mountain");
	} else if (info.menuItemId === "timeZoneSelectorPacific") {
		commonUtilities.saveTimeZone("US/Pacific");
	} else if (info.menuItemId === "teamColorMenuOption") {
		commonUtilities.saveShouldShowTeamColor(info.checked);
	} else {
		commonUtilities.saveSelectedTeam(info.menuItemId);
	}
	
	updateGameData();
});

function addTeamSelectorMenuOptions() {
	var teamMenuItem = chrome.contextMenus.create({
		"title": "Select Team...",
		"contexts": ["action"],
		"id": "teamSelector"
	});
	
	for (var i = 0, len = teams.length; i < len; i++) {
		var team = teams[i];
		var menuIndex = chrome.contextMenus.create({
			"type": "radio",
			"checked": commonUtilities.getTeamName() == team,
			"title": team,
			"parentId": teamMenuItem,
			"contexts": ["action"],
			"id": team
		}, function() {
			if (chrome.runtime.lastError) {
				console.log("error creating menu item:" + chrome.runtime.lastError);
			}
		});
	}
}

function addTimeZoneMenuOptions() {
	const timeZone = commonUtilities.getTimeZone();

	chrome.contextMenus.create({
		"type": "separator",
		"id": "timeZoneSeparator"
	});
	
	const central = chrome.contextMenus.create({
		"type":"radio",
		"checked": timeZone == "US/Central",
		"title":"Central Time",
		"contexts":["action"],
		"id": "timeZoneSelectorCentral"
	});
	
	const eastern = chrome.contextMenus.create({
		"type":"radio",
		"checked": timeZone == "US/Eastern",
		"title":"Eastern Time",
		"contexts":["action"],
		"id": "timeZoneSelectorEastern"
	});
	
	const mountain = chrome.contextMenus.create({
		"type":"radio",
		"checked": timeZone == "US/Mountain",
		"title":"Mountain Time",
		"contexts":["action"],
		"id": "timeZoneSelectorMountain"
	});
	
	const pacific = chrome.contextMenus.create({
		"type":"radio",
		"checked": timeZone == "US/Pacific",
		"title":"Pacific Time",
		"contexts":["action"],
		"id": "timeZoneSelectorPacific"
	});
}

function addTeamColorMenuOption() {
	chrome.storage.sync.get([ 'shouldShowTeamColor' ], function(result) {
		var shouldShowTeamColor = false;
		if (result.shouldShowTeamColor == undefined) {
			chrome.storage.sync.set({'shouldShowTeamColor': true});
			shouldShowTeamColor = true;
		} else {
			shouldShowTeamColor = result.shouldShowTeamColor;
		}
		
		chrome.contextMenus.create({
		"type":"checkbox",
		"checked": shouldShowTeamColor,
		"title":"Show Team Colors",
		"contexts":["action"],
		"id": "teamColorMenuOption"
	});	
	});
}

function updateGameData() {
	teamId = commonUtilities.getTeamId();
	teamAbbv = commonUtilities.getTeamAbbv();
	teamName = commonUtilities.getTeamName();

	APICallsUtility.fetchTeamSeasonSchedule(teamAbbv, teamName, setScheduleData, setNoGame);
}

function setScheduleData(scheduleInfo) {
	const todayYear = commonUtilities.getTodayYear();
	const todayMonth = commonUtilities.getTodayMonth();
	const todayDay = commonUtilities.getTodayDay();
	const gameIndex = APIDataUtility.findScheduleGameIndex(scheduleInfo, todayYear, todayMonth, todayDay);
	
	if (gameIndex && gameIndex >= 0) {
		const todayGame = APIDataUtility.getTodaysGame(scheduleInfo, gameIndex);
		
		currentGameId = APIDataUtility.getTodaysGameId(todayGame);
		var dateTime = new Date(APIDataUtility.getTodaysGameDateTime(todayGame));
		localGameTime = getTimeZoneAdjustedTime(dateTime);
		
		APICallsUtility.fetchCurrentGameData(currentGameId, teamName, setGameData, setNoGame);
	} else {
		setNoGame(teamName);
	}
}

function setGameData(gameData) {
	const teamName = commonUtilities.getTeamName();
	teamIsHome = APIDataUtility.getHomeTeamId(gameData) === teamId;
	awayTeamInitial = APIDataUtility.getAwayTeamAbbrev(gameData);
	homeTeamInitial = APIDataUtility.getHomeTeamAbbrev(gameData);
	
	var tagText = "No " + teamName + " game today.";
	var badgeText = "";
	var icon = commonUtilities.getTeamIcon();
	var gameToday = currentGameId != false;
	
	if (gameToday) {
		var awayScore = APIDataUtility.getAwayTeamScore(gameData);
		var homeScore = APIDataUtility.getHomeTeamScore(gameData);
		var otherTeamName = "other team";
		var venue = APIDataUtility.getVenueName(gameData);
		otherTeamName = teamIsHome ? APIDataUtility.getAwayTeamName(gameData) : APIDataUtility.getHomeTeamName(gameData);
		const gameState = APIDataUtility.getGameState(gameData);
		
		var textItems;
		if (gameState === APIGameStates.FUTURE || gameState === APIGameStates.PREGAME) {
			textItems = setPregame(teamName, otherTeamName, venue, localGameTime);
		} else if (gameState === APIGameStates.FINAL || gameState === APIGameStates.OFF) {
			textItems = setFinal(teamIsHome, otherTeamName, homeScore, awayScore, venue);
			
			var teamScore = teamIsHome ? homeScore : awayScore;
			var otherTeamScore = teamIsHome ? awayScore : homeScore;
			
			if (otherTeamScore > teamScore) {
				icon = lossIcon;
			} else {
				icon = winIcon;
			}
		} else if (gameState === APIGameStates.LIVE || gameState === APIGameStates.CRITICAL) {
			textItems = setLive(teamIsHome, homeScore, awayScore, gameData, otherTeamName);
		} else if (gameState === APIGameStates.POSTPONED) {
			textItems = setPostponed(teamName, otherTeamName, venue);
		} else {
			badgeText = "TBD";
			tagText = "The status of the game could not be determined at this time. Please try reselecting your team. If that does not work, please send a bug report to the developer.";
		}
		
		if (textItems) {
			badgeText = textItems[0];
			tagText = textItems[1];
		}
	}
	
	if (tagText) {
		chrome.action.setTitle({title: tagText});
	}
	if (badgeText !== false) {
		chrome.action.setBadgeBackgroundColor({ color: [0, 0, 0, 255] });
		chrome.action.setBadgeText({text: badgeText});
	}

	drawLogo(icon, gameToday);
}

function setPregame(teamName, otherTeamName, venue, localGameTime) {
	currentlyPreGame = true;
	
	return [localGameTime.substring(0, localGameTime.length - 2), teamName + " vs " + otherTeamName + " at " + venue + ". Puck drops at " + localGameTime + "."];
}

function setPostponed(teamName, otherTeamName, venue) {
	currentlyPreGame = false;
	
	return [APIGameStates.POSTPONED, teamName + " vs " + otherTeamName + " at " + venue + " has been postponed."];
}

function setFinal(teamIsHome, otherTeamName, homeScore, awayScore, venue) {
	var gameResult;
	var teamScore = teamIsHome ? homeScore : awayScore;
	var otherTeamScore = teamIsHome ? awayScore : homeScore;
	if (otherTeamScore > teamScore) {
		gameResult = "lost to";
	} else {
		gameResult = "beat";
	}
	
	if (gameTimeDataRefreshTimer) {
		clearInterval(gameTimeDataRefreshTimer);
		gameTimeDataRefreshTimer = false;
	}
	currentlyPreGame = false;
	
	return [awayScore + "-" + homeScore, "The " + teamName + " " + gameResult + " the " + otherTeamName + " " + teamScore + "-" + otherTeamScore + " at " + venue];
}

function setLive(teamIsHome, homeScore, awayScore, gameData, otherTeamName) {
	var scoreStatus;
	var teamScore = teamIsHome ? homeScore : awayScore;
	var otherTeamScore = teamIsHome ? awayScore : homeScore;
	if (teamScore > otherTeamScore) {
		scoreStatus = "leading";
	} else if (teamScore < otherTeamScore) {
		scoreStatus = "trailing"
	} else if (awayScore === homeScore) {
		scoreStatus = "tied with";
	}
	
	var period = APIDataUtility.getCurrentPeriod(gameData);
	var isShootout = APIDataUtility.getCurrentPeriodType(gameData) === APIGameStates.SHOOTOUT;
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
		default:
			period = "overtime";
			break;
	}
	
	if (isShootout) {
		period = "the shootout";
	}
	
	var tagText;
	if (APIDataUtility.getIsInIntermission(gameData)) {
		tagText = "The " + teamName + " are " + scoreStatus + " the " + otherTeamName + " " + teamScore + "-" + otherTeamScore + " at the end of " + period + ".";
	} else {
		if (isShootout) {
			home = APIDataUtility.getHomeTeamShootoutGoals(gameData);
			away = APIDataUtility.getAwayTeamShootoutGoals(gameData);
			if (teamIsHome) {
				teamScore = home;
				otherTeamScore = away;
			} else {
				teamScore = away;
				otherTeamScore = home;
			}
			tagText = "The " + teamName + " are " + scoreStatus + " the " + otherTeamName + " " + teamScore + "-" + otherTeamScore + " in " + period;
		} else {
			tagText = "The " + teamName + " are " + scoreStatus + " the " + otherTeamName + " " + teamScore + "-" + otherTeamScore + " in " + period + " with " + APIDataUtility.getGameTimeRemaining(gameData) + " remaining";
		}
	}
	
	startInGameDataUpdateTimerIfNeeded();
	currentlyPreGame = false;
	
	return [awayScore + "-" + homeScore, tagText];
}

function setNoGame(teamName) {
	currentGameId = false;
	chrome.action.setTitle({title: "No " + teamName + " game today."});
	chrome.action.setBadgeText({text: ""});
	drawLogo(commonUtilities.getTeamIcon(), false);
}

function startInGameDataUpdateTimerIfNeeded() {
	if (gameTimeDataRefreshTimer == false) {
		gameTimeDataRefreshTimer = setInterval(updateData, 2000);
	}
}

function updateData() {
	if (!commonUtilities.getTeamAbbv()) {
		commonUtilities = CommonUtilities.init();
		teams = commonUtilities.getTeams();
	}
	
	commonUtilities.updateData();
	updateGameData();
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

function drawLogo(logoSource, useColorImage) {
	var context = iconCanvas.getContext('2d');
	
	const imageBlob = fetch(logoSource)
		.then(response => response.blob())
		.then(blob => {
			const imageBitmap = createImageBitmap(blob).then(imageBitmap => {
				context.clearRect(0, 0, imageBitmap.height, imageBitmap.width);
				context.drawImage(imageBitmap, 0, 0);
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
				
				chrome.action.setIcon({
				  imageData: imageData
				});
			});
		});
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