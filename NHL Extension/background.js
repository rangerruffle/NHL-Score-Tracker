var awayTeamInitial = "";
var currentlyPreGame = true;
var currentGameId = false;
var gameCompleteIconSet = "20000101";
var homeTeamInitial = "";
var iconCanvas = document.createElement('canvas');
var lossIcon = "logos/loss.png";
var teamMenuItems = [];
var teamIsHome = false;
var winIcon = "logos/win.png";

CommonUtilities.init("NHLScoreTrackerIcon");
addTeamSelectorMenuOptions();
addTimeZoneMenuOptions();
addBugReportingOption();

addTeamSelectorMenuOptions: function() {
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
			"checked": teamName == team,
			"title": team,
			"parentId": teamMenuItem,
			"contexts": ["browser_action"],
			"onclick": function(info, tab) {
				saveSelectedTeam(teamMenuItems[info.menuItemId]);
			}
		}, function() {
			if (chrome.runtime.lastError) {
				console.log("error creating menu item:" + chrome.runtime.lastError);
			}
		});
		
		teamMenuItems[menuIndex] = team;
	}
}

addTimeZoneMenuOptions: function() {
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
			saveTimeZone("US/Central");
		}
	});
	
	chrome.contextMenus.create({
		"documentUrlPatterns": [ window.location.protocol + "//" + window.location.hostname + "/*" ],
		"type":"radio",
		"checked": timeZone == "US/Eastern",
		"title":"Eastern Time",
		"contexts":["browser_action"],
		"onclick":function(info, tab) {
			saveTimeZone("US/Eastern");
		}
	});
	
	chrome.contextMenus.create({
		"documentUrlPatterns": [ window.location.protocol + "//" + window.location.hostname + "/*" ],
		"type":"radio",
		"checked": timeZone == "US/Mountain",
		"title":"Mountain Time",
		"contexts":["browser_action"],
		"onclick":function(info, tab) {
			saveTimeZone("US/Mountain");
		}
	});
	
	chrome.contextMenus.create({
		"documentUrlPatterns": [ window.location.protocol + "//" + window.location.hostname + "/*" ],
		"type":"radio",
		"checked": timeZone == "US/Pacific",
		"title":"Pacific Time",
		"contexts":["browser_action"],
		"onclick":function(info, tab) {
			saveTimeZone("US/Pacific");
		}
	});
}

addBugReportingOption: function() {
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

saveTimeZone: function(newZone) {
	timeZone = newZone;
	chrome.storage.sync.set({'trackedTimeZone': newZone});
	CommonUtilities.updateData();
}

reportBug: function() {
	alert("This is still being worked on. For the time being, feel free to email the developer with any bugs or concerns at erickson.russell.j@gmail.com.\n\nThank you for using my extension!");
}

updateGameData: function(yyyy, mm, dd) {
	teamId = teamIds[teamName];
	var gameLiveLink = "";
	var localGameTime = false;
	var scheduleXmlHttp = new XMLHttpRequest();
	scheduleXmlHttp.open("GET", "https://statsapi.web.nhl.com/api/v1/schedule?startDate=" + todayYear + "-" + todayMonth + "-" + todayDay + "&endDate=" + todayYear + "-" + todayMonth + "-" + todayDay + "&expand=schedule.teams,schedule.game&site=en_nhl&teamId=" + teamId);
	scheduleXmlHttp.onreadystatechange = function () {
		if (scheduleXmlHttp.readyState == 4 && scheduleXmlHttp.status == 200) {
			var scheduleInfo = JSON.parse(scheduleXmlHttp.responseText);
			
			if (scheduleInfo.dates[0]) {
				if (scheduleInfo.dates[0].games[0]) {
					currentGameId = scheduleInfo.dates[0].games[0].gamePk;
					var dateTime = new Date(scheduleInfo.dates[0].games[0].gameDate);
					localGameTime = getTimeZoneAdjustedTime(dateTime);
					gameLiveLink = scheduleInfo.dates[0].games[0].link;
				} else {
					setNoGame();
				}
			} else {
				setNoGame();
			}
		}
	}
<<<<<<< HEAD
	
	Promise.resolve(scheduleXmlHttp.onreadystatechange()).then(function() {
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
=======

	setTimeout(
		function() {
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
>>>>>>> origin/master
						
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
							
<<<<<<< HEAD
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
=======
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
								var isShootout = false;
								if (game.game.type === "R") {
									isShootout = period === 5;
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
								} else if (game.game.type === "P") {
									isShootout = false;
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
										default:
											period = "the " + getPeriodSuffix(period) + " overtime";
									}
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
>>>>>>> origin/master
									} else {
										teamScore = away;
										otherTeamScore = home;
									}
									tagText = "The " + teamName + " are " + scoreStatus + " the " + otherTeamName + " " + teamScore + "-" + otherTeamScore + " in " + period;
								} else {
									tagText = "The " + teamName + " are " + scoreStatus + " the " + otherTeamName + " " + teamScore + "-" + otherTeamScore + " in " + period + " with " + gameInfo.liveData.linescore.currentPeriodTimeRemaining + " remaining";
								}
<<<<<<< HEAD
=======
								
								badgeText = awayScore + "-" + homeScore;
								startInGameDataUpdateTimerIfNeeded();
								currentlyPreGame = false;
							} else {
								badgeText = "TBD";
								tagText = "The status of the game could not be determined at this time. Please try reselecting your team and waiting a second for the system to update. If that does not work, please send a bug report to the developer.";
>>>>>>> origin/master
							}
							
							badgeText = awayScore + "-" + homeScore;
							startInGameDataUpdateTimerIfNeeded();
							currentlyPreGame = false;
						} else {
							badgeText = "TBD";
							tagText = "The status of the game could not be determined at this time. Please try reselecting your team. If that does not work, please send a bug report to the developer.";
						}
<<<<<<< HEAD
=======
						
						if (tagText) {
							chrome.browserAction.setTitle({title: tagText});
						}
						if (badgeText !== false) {
							chrome.browserAction.setBadgeBackgroundColor({ color: [0, 0, 0, 255] });
							chrome.browserAction.setBadgeText({text: badgeText});
						}

						drawLogo(icon, gameToday);
>>>>>>> origin/master
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
	});

<<<<<<< HEAD
	scheduleXmlHttp.send(null);
=======
function setNoGame() {
	currentGameId = false;
	chrome.browserAction.setTitle({title: "No " + teamName + " game today."});
	chrome.browserAction.setBadgeText({text: ""});
	drawLogo(teamIcon, false);
}

function startInGameDataUpdateTimerIfNeeded() {
	if (gameTimeDataRefreshTimer == false) {
		gameTimeDataRefreshTimer = setInterval(updateData, 10000);
	}
>>>>>>> origin/master
}

getTimeZoneAdjustedTime: function(dateTime) {
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

drawLogo: function(logoSource, useColorImage) {
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