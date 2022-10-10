import CommonUtilities from "./CommonUtilities.js";

var awayTeamInitial = "";
var currentlyPreGame = true;
var currentGameId = false;
var gameCompleteIconSet = "20000101";
var gameTimeDataRefreshTimer = false;
var homeTeamInitial = "";
var iconCanvas = new OffscreenCanvas(128, 128)
var lossIcon = "logos/loss.png";
var teamId = 0;
var teamIsHome = false;
var teamMenuItems = [];
var teamName = "";
var winIcon = "logos/win.png";
var localGameTime = false;
var gameLiveLink = "";

const commonUtilities = CommonUtilities.init();
const teams = CommonUtilities.getTeams();
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

chrome.runtime.onInstalled.addListener(() => {
	addTeamSelectorMenuOptions();
	addTimeZoneMenuOptions();
	addBugReportingOption();
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
	if (info.menuItemId === "timeZoneSelectorCentral") {
		commonUtilities.saveTimeZone("US/Central");
	} else if (info.menuItemId === "timeZoneSelectorEastern") {
		commonUtilities.saveTimeZone("US/Eastern");
	} else if (info.menuItemId === "timeZoneSelectorMountain") {
		commonUtilities.saveTimeZone("US/Mountain");
	} else if (info.menuItemId === "timeZoneSelectorPacific") {
		commonUtilities.saveTimeZone("US/Pacific");
	} else {
		CommonUtilities.saveSelectedTeam(teamMenuItems[info.menuItemId]);
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
			"id": "teamSelectorRadioButton" + team
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

function addBugReportingOption() {
	//chrome.contextMenus.create({
		//"type": "separator",
		//"id": "bugReportSeparator"
	//});

	//const bugReport = chrome.contextMenus.create({
		//"type": "normal",
		//"title": "Report a Bug",
		//"contexts": ["action"],
		//"id": "bugReport"
	//});
	
	//bugReport.onClicked.addListener(function() {
		//reportBug();
	//});
}

function reportBug() {
	alert("This is still being worked on. For the time being, feel free to email the developer with any bugs or concerns at erickson.russell.j@gmail.com.\n\nThank you for using my extension!");
}

function updateGameData() {
	teamId = commonUtilities.getTeamId();
	teamName = commonUtilities.getTeamName();
	const todayYear = commonUtilities.getTodayYear();
	const todayMonth = commonUtilities.getTodayMonth();
	const todayDay = commonUtilities.getTodayDay();
	
	fetch("https://statsapi.web.nhl.com/api/v1/schedule?startDate=" + todayYear + "-" + todayMonth + "-" + todayDay + "&endDate=" + todayYear + "-" + todayMonth + "-" + todayDay + "&expand=schedule.teams,schedule.game&site=en_nhl&teamId=" + teamId)
		.catch(error => {
			setNoGame(teamName);
		})
		.then(response => response.json())
		.then(scheduleInfo => {
			setScheduleData(scheduleInfo);
		});
}

function setScheduleData(scheduleInfo) {
	if (scheduleInfo.dates[0]) {
		if (scheduleInfo.dates[0].games[0]) {
			currentGameId = scheduleInfo.dates[0].games[0].gamePk;
			var dateTime = new Date(scheduleInfo.dates[0].games[0].gameDate);
			localGameTime = getTimeZoneAdjustedTime(dateTime);
			gameLiveLink = scheduleInfo.dates[0].games[0].link;
			
			fetch("https://statsapi.web.nhl.com/" + gameLiveLink)
				.catch(error => {
					setNoGame(teamName);
				})
				.then(response => response.json())
				.then(gameInfo => {
					setGameData(gameInfo);
				});
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
				clearInterval(gameTimeDataRefreshTimer);
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
		chrome.action.setTitle({title: tagText});
	}
	if (badgeText !== false) {
		chrome.action.setBadgeBackgroundColor({ color: [0, 0, 0, 255] });
		chrome.action.setBadgeText({text: badgeText});
	}

	drawLogo(icon, gameToday);
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