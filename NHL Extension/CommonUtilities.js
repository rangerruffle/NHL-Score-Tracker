const CommonUtilities = {
	_teams: [ "Avalanche", "Blackhawks", "Blue Jackets", "Blues", "Bruins", "Canadiens", "Canucks", "Capitals", "Coyotes", "Devils", "Ducks", "Flames", "Flyers", "Golden Knights", "Hurricanes", "Islanders", "Jets", "Kings", "Lightning", "Maple Leafs", "Oilers", "Panthers", "Penguins", "Predators", "Rangers", "Red Wings", "Sabres", "Senators", "Sharks", "Stars", "Wild" ],
	_teamIds: { "Avalanche": 21, "Blackhawks": 16, "Blue Jackets": 29, "Blues": 19, "Bruins": 6, "Canadiens": 8, "Canucks": 23, "Capitals": 15, "Coyotes": 53, "Devils": 1, "Ducks": 24, "Flames": 20, "Flyers": 4, "Golden Knights": 54, "Hurricanes": 12, "Islanders": 2, "Jets": 52, "Kings": 26, "Lightning": 14, "Maple Leafs": 10, "Oilers": 22, "Panthers": 13, "Penguins": 5, "Predators": 18, "Rangers": 3, "Red Wings": 17, "Sabres": 7, "Senators": 9, "Sharks": 28, "Stars": 25, "Wild": 30 },
	
	_teamIcon: "logos/nhl.png",
	_teamId: "",
	_teamName: "",
	_timeZone: "US/Central",
	_todayYear: "",
	_todayMonth: "",
	_todayDay: "",

	init() {
		var context = this;
		
		chrome.storage.sync.get([ 'trackedTeamName','trackedTimeZone' ], function(result) {
			if (result.trackedTeamName) {
				context._teamName = result.trackedTeamName;
				context._teamId = context._teamIds[context._teamName];
				context._teamIcon = "logos/" + result.trackedTeamName + ".png";
			}
			
			if (result.trackedTimeZone) {
				context._timeZone = result.trackedTimeZone;
			}
		});

		return this;
	},
	
	saveSelectedTeam(newTeam) {
		this._teamName = newTeam;
		this._teamId = this.getTeamIdMapping()[newTeam];
		this._teamIcon = "logos/" + newTeam + ".png";
		chrome.storage.sync.set({'trackedTeamName': newTeam});
		this.updateData();
	},

	saveTimeZone(newZone) {
		this._timeZone = newZone;
		chrome.storage.sync.set({'trackedTimeZone': newZone});
		this.updateData();
	},

	updateData() {
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
	},

	getTeams() {
		return this._teams;
	},

	getTeamIdMapping() {
		return this._teamIds;
	},
	
	getTeamIcon() {
		return this._teamIcon;
	},

	getTeamId() {
		return this._teamId;
	},
	
	getTeamName() {
		return this._teamName;
	},
	
	getTimeZone() {
		return this._timeZone;
	},
	
	getTodayYear() {
		return this._todayYear;
	},
	
	getTodayMonth() {
		return this._todayMonth;
	},
	
	getTodayDay() {
		return this._todayDay;
	},
};