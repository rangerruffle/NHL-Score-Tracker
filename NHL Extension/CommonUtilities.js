const CommonUtilities = {
	_teams: [ "Avalanche", "Blackhawks", "Blue Jackets", "Blues", "Bruins", "Canadiens", "Canucks", "Capitals", "Coyotes", "Devils", "Ducks", "Flames", "Flyers", "Golden Knights", "Hurricanes", "Islanders", "Jets", "Kings", "Lightning", "Maple Leafs", "Oilers", "Panthers", "Penguins", "Predators", "Rangers", "Red Wings", "Sabres", "Senators", "Sharks", "Stars", "Wild" ],
	_teamIds: { "Avalanche": 21, "Blackhawks": 16, "Blue Jackets": 29, "Blues": 19, "Bruins": 6, "Canadiens": 8, "Canucks": 23, "Capitals": 15, "Coyotes": 53, "Devils": 1, "Ducks": 24, "Flames": 20, "Flyers": 4, "Golden Knights": 54, "Hurricanes": 12, "Islanders": 2, "Jets": 52, "Kings": 26, "Lightning": 14, "Maple Leafs": 10, "Oilers": 22, "Panthers": 13, "Penguins": 5, "Predators": 18, "Rangers": 3, "Red Wings": 17, "Sabres": 7, "Senators": 9, "Sharks": 28, "Stars": 25, "Wild": 30 },
	_teamDivisionsId: { "Avalanche": 16, "Blackhawks": 16, "Blue Jackets": 18, "Blues": 16, "Bruins": 17, "Canadiens": 17, "Canucks": 15, "Capitals": 18, "Coyotes": 15, "Devils": 18, "Ducks": 15, "Flames": 15, "Flyers": 18, "Golden Knights": 15, "Hurricanes": 18, "Islanders": 18, "Jets": 16, "Kings": 15, "Lightning": 17, "Maple Leafs": 17, "Oilers": 15, "Panthers": 17, "Penguins": 18, "Predators": 16, "Rangers": 18, "Red Wings": 17, "Sabres": 17, "Senators": 17, "Sharks": 15, "Stars": 16, "Wild": 16 },
	_teamConferencesId: { "Avalanche": 5, "Blackhawks": 5, "Blue Jackets": 6, "Blues": 5, "Bruins": 6, "Canadiens": 6, "Canucks": 5, "Capitals": 6, "Coyotes": 5, "Devils": 6, "Ducks": 5, "Flames": 5, "Flyers": 6, "Golden Knights": 5, "Hurricanes": 6, "Islanders": 6, "Jets": 5, "Kings": 5, "Lightning": 6, "Maple Leafs": 6, "Oilers": 5, "Panthers": 6, "Penguins": 6, "Predators": 5, "Rangers": 6, "Red Wings": 6, "Sabres": 6, "Senators": 6, "Sharks": 5, "Stars": 5, "Wild": 5 },

	_teamIcon: "logos/nhl.png",
	_teamId: 0,
	_teamName: "",
	_teamDivisionId: 0,
	_teamConferenceId: 0,
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
				context._teamDivisionId = context._teamDivisionsId[context._teamName];
				context._teamConferenceId = context._teamConferencesId[context._teamName];
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

	getTeamDivisionId() {
		return this._teamDivisionId;
	},

	getTeamConferenceId() {
		return this._teamConferenceId;
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