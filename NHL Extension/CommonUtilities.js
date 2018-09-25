const CommonUtilities = {
	const _teams = [ "Avalanche", "Blackhawks", "Blue Jackets", "Blues", "Bruins", "Canadiens", "Canucks", "Capitals", "Coyotes", "Devils", "Ducks", "Flames", "Flyers", "Golden Knights", "Hurricanes", "Islanders", "Jets", "Kings", "Lightning", "Maple Leafs", "Oilers", "Panthers", "Penguins", "Predators", "Rangers", "Red Wings", "Sabres", "Senators", "Sharks", "Stars", "Wild" ];
	const _teamIds = { "Avalanche": 21, "Blackhawks": 16, "Blue Jackets": 29, "Blues": 19, "Bruins": 6, "Canadiens": 8, "Canucks": 23, "Capitals": 15, "Coyotes": 53, "Devils": 1, "Ducks": 24, "Flames": 20, "Flyers": 4, "Golden Knights": 54, "Hurricanes": 12, "Islanders": 2, "Jets": 52, "Kings": 26, "Lightning": 14, "Maple Leafs": 10, "Oilers": 22, "Panthers": 13, "Penguins": 5, "Predators": 18, "Rangers": 3, "Red Wings": 17, "Sabres": 7, "Senators": 9, "Sharks": 28, "Stars": 25, "Wild": 30 };
	
	var _gameTimeDataRefreshTimer = false;
	var _teamIcon = "logos/nhl.png";
	var _teamId = "";
	var _teamName = "";
	var _timeZone = "US/Central";
	var _todayYear = "";
	var _todayMonth = "";
	var _todayDay = "";

	init: function(alarmName) {
		chrome.alarms.create(
			alarmName,
			{
				when: Date.now() + 5000,
				periodInMinutes: 60
			}
		);
		
		chrome.alarms.onAlarm.addListener(function(alarm) {
			if (alarm.name = alarmName) {
				this.updateData();
			}
		});
		
		chrome.storage.sync.get([ 'trackedTeamName','trackedTimeZone' ], function(result) {
			if (result.trackedTeamName) {
				this._teamName = result.trackedTeamName;
				this._teamIcon = "logos/" + result.trackedTeamName + ".png";
			}
			
			if (result.trackedTimeZone) {
				this._timeZone = result.trackedTimeZone;
			}
		});
	}
	
	saveSelectedTeam: function(newTeam) {
		this._teamName = newTeam;
		this._teamId = teamIds[newTeam];
		this._teamIcon = "logos/" + newTeam + ".png";
		chrome.storage.sync.set({'trackedTeamName': newTeam});
		this.updateData();
	}

	updateData: function() {
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
		
		this._todayYear = yyyy;
		this._todayMonth = mm;
		this._todayDay = dd;

		updateGameData(this._todayYear, this._todayMonth, this._todayDay);
	}

	startInGameDataUpdateTimerIfNeeded: function() {
		if (this._gameTimeDataRefreshTimer == false) {
			this._gameTimeDataRefreshTimer = setInterval(this.updateData, 1000);
		}
	}

	getTeams: function() {
		return this._teams;
	}

	getTeamIdMapping: function() {
		return this._teamIds;
	}
	
	getTeamIcon: function() {
		return this._teamIcon;
	}

	getTeamId: function() {
		return this._teamId;
	}
	
	getTeamName: function() {
		return this._teamName;
	}
	
	getTimeZone: function() {
		return this._timeZone;
	}
	
	getTodayYear: function() {
		return this._todayYear;
	}
	
	getTodayMonth: function() {
		return this._todayMonth;
	}
	
	getTodayDay: function() {
		return this._todayDay;
	}
}

module.exports = CommonUtilities;