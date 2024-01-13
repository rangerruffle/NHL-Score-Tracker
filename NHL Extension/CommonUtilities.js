const CommonUtilities = {
	_teams: [ "Avalanche", "Blackhawks", "Blue Jackets", "Blues", "Bruins", "Canadiens", "Canucks", "Capitals", "Coyotes", "Devils", "Ducks", "Flames", "Flyers", "Golden Knights", "Hurricanes", "Islanders", "Jets", "Kings", "Kraken", "Lightning", "Maple Leafs", "Oilers", "Panthers", "Penguins", "Predators", "Rangers", "Red Wings", "Sabres", "Senators", "Sharks", "Stars", "Wild" ],
	_teamAbbvs: { "Avalanche": "COL", "Blackhawks": "CHI", "Blue Jackets": "CBJ", "Blues": "STL", "Bruins": "BOS", "Canadiens": "MTL", "Canucks": "VAN", "Capitals": "WSH", "Coyotes": "ARI", "Devils": "NJD", "Ducks": "ANA", "Flames": "CGY", "Flyers": "PHI", "Golden Knights": "VGK", "Hurricanes": "CAR", "Islanders": "NYI", "Jets": "WPG", "Kings": "LAK", "Kraken": "SEA", "Lightning": "TBL", "Maple Leafs": "TOR", "Oilers": "EDM", "Panthers": "FLA", "Penguins": "PIT", "Predators": "NSH", "Rangers": "NYR", "Red Wings": "DET", "Sabres": "BUF", "Senators": "OTT", "Sharks": "SJS", "Stars": "DAL", "Wild": "MIN" },
	_teamIds: { "Avalanche": 21, "Blackhawks": 16, "Blue Jackets": 29, "Blues": 19, "Bruins": 6, "Canadiens": 8, "Canucks": 23, "Capitals": 15, "Coyotes": 53, "Devils": 1, "Ducks": 24, "Flames": 20, "Flyers": 4, "Golden Knights": 54, "Hurricanes": 12, "Islanders": 2, "Jets": 52, "Kings": 26, "Kraken": 55, "Lightning": 14, "Maple Leafs": 10, "Oilers": 22, "Panthers": 13, "Penguins": 5, "Predators": 18, "Rangers": 3, "Red Wings": 17, "Sabres": 7, "Senators": 9, "Sharks": 28, "Stars": 25, "Wild": 30 },
	_teamNamesById: { 21: "Avalanche", 16: "Blackhawks", 29: "Blue Jackets", 19: "Blues", 6: "Bruins", 8: "Canadiens", 23: "Canucks", 15: "Capitals", 53: "Coyotes", 1: "Devils", 24: "Ducks", 20: "Flames", 4: "Flyers", 54: "Golden Knights", 12: "Hurricanes", 2: "Islanders", 52: "Jets", 26: "Kings", 55: "Kraken", 14: "Lightning", 10: "Maple Leafs", 22: "Oilers", 13: "Panthers", 5: "Penguins", 18: "Predators", 3: "Rangers", 17: "Red Wings", 7: "Sabres", 9: "Senators", 28: "Sharks", 25: "Stars", 30: "Wild" },
	_teamDivisionIds: { "Avalanche": 16, "Blackhawks": 16, "Blue Jackets": 18, "Blues": 16, "Bruins": 17, "Canadiens": 17, "Canucks": 15, "Capitals": 18, "Coyotes": 16, "Devils": 18, "Ducks": 15, "Flames": 15, "Flyers": 18, "Golden Knights": 15, "Hurricanes": 18, "Islanders": 18, "Jets": 16, "Kings": 15, "Kraken": 15, "Lightning": 17, "Maple Leafs": 17, "Oilers": 15, "Panthers": 17, "Penguins": 18, "Predators": 16, "Rangers": 18, "Red Wings": 17, "Sabres": 17, "Senators": 17, "Sharks": 15, "Stars": 16, "Wild": 16 },
	_teamConferenceIds: { "Avalanche": 5, "Blackhawks": 5, "Blue Jackets": 6, "Blues": 5, "Bruins": 6, "Canadiens": 6, "Canucks": 5, "Capitals": 6, "Coyotes": 5, "Devils": 6, "Ducks": 5, "Flames": 5, "Flyers": 6, "Golden Knights": 5, "Hurricanes": 6, "Islanders": 6, "Jets": 5, "Kings": 5, "Kraken": 5, "Lightning": 6, "Maple Leafs": 6, "Oilers": 5, "Panthers": 6, "Penguins": 6, "Predators": 5, "Rangers": 6, "Red Wings": 6, "Sabres": 6, "Senators": 6, "Sharks": 5, "Stars": 5, "Wild": 5 },
	_teamColorClasses: { "Avalanche": "avalanche", "Blackhawks": "blackhawks", "Blue Jackets": "blueJackets", "Blues": "blues", "Bruins": "bruins", "Canadiens": "canadiens", "Canucks": "canucks", "Capitals": "capitals", "Coyotes": "coyotes", "Devils": "devils", "Ducks": "ducks", "Flames": "flames", "Flyers": "flyers", "Golden Knights": "goldenKnights", "Hurricanes": "hurricanes", "Islanders": "islanders", "Jets": "jets", "Kings": "kings", "Kraken": "kraken", "Lightning": "lightning", "Maple Leafs": "mapleLeafs", "Oilers": "oilers", "Panthers": "panthers", "Penguins": "penguins", "Predators": "predators", "Rangers": "rangers", "Red Wings": "redWings", "Sabres": "sabres", "Senators": "senators", "Sharks": "sharks", "Stars": "stars", "Wild": "wild" },
	_monthNames: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],

	_teamIcon: "logos/nhl.png",
	_teamId: 0,
	_teamAbbv: "",
	_teamName: "",
	_teamDivisionId: 0,
	_teamConferenceId: 0,
	_teamColorClass: "",
	_timeZone: "US/Central",
	_todayYear: "",
	_todayMonth: "",
	_todayDay: "",
	_currentMonthStartDate: null,
	_currentMonthEndDate: null,

	init() {
		var context = this;
		
		chrome.storage.sync.get([ 'trackedTeamName','trackedTimeZone' ], function(result) {
			if (result.trackedTeamName) {
				context.setTeamName(result.trackedTeamName);
				context.setTeamId(context.getTeamIds()[context.getTeamName()]);
				context.setTeamAbbv(context.getTeamAbbvs()[context.getTeamName()]);
				context.setTeamDivisionId(context.getTeamDivisionIds()[context.getTeamName()]);
				context.setTeamConferenceId(context.getTeamConferenceIds()[context.getTeamName()]);
				context.setTeamColorClass(context.getTeamColorClasses()[context.getTeamName()]);
				context.setTeamIcon("logos/" + context.getTeamName() + ".png");
			} else {
				context.setTeamName("Avalanche");
				context.setTeamId(context.getTeamIds()[context.getTeamName()]);
				context.setTeamAbbv(context.getTeamAbbvs()[context.getTeamName()]);
				context.setTeamDivisionId(context.getTeamDivisionIds()[context.getTeamName()]);
				context.setTeamConferenceId(context.getTeamConferenceIds()[context.getTeamName()]);
				context.setTeamColorClass(context.getTeamColorClasses()[context.getTeamName()]);
				context.setTeamIcon("logos/" + context.getTeamName() + ".png");
			}
			
			if (result.trackedTimeZone) {
				context.setTimeZone(result.trackedTimeZone);
			}
		});

		return context;
	},
	
	saveSelectedTeam(newTeam) {
		this._teamName = newTeam;
		this._teamId = this.getTeamIdMapping()[newTeam];
		this._teamAbbv = this.getTeamAbbvMapping()[newTeam];
		this._teamIcon = "logos/" + newTeam + ".png";
		chrome.storage.sync.set({'trackedTeamName': newTeam});
		this.updateData();
	},

	saveTimeZone(newZone) {
		this._timeZone = newZone;
		chrome.storage.sync.set({'trackedTimeZone': newZone});
		this.updateData();
	},
	
	saveShouldShowTeamColor(checked) {
		chrome.storage.sync.set({'shouldShowTeamColor': checked});
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
	
	getTeamAbbvMapping() {
		return this._teamAbbvs;
	},

	getTeamNameIdMapping() {
		return this._teamNamesById;
	},
	
	getTeamIcon() {
		return this._teamIcon;
	},

	getTeamId() {
		return this._teamId;
	},
	
	getTeamAbbv() {
		return this._teamAbbv;
	},

	getTeamIds() {
		return this._teamIds;
	},
	
	getTeamAbbvs() {
		return this._teamAbbvs;
	},

	getTeamDivisionId() {
		return this._teamDivisionId;
	},

	getTeamDivisionIds() {
		return this._teamDivisionIds;
	},

	getTeamConferenceId() {
		return this._teamConferenceId;
	},

	getTeamConferenceIds() {
		return this._teamConferenceIds;
	},

	getTeamColorClass() {
		return this._teamColorClass;
	},

	getTeamColorClasses() {
		return this._teamColorClasses;
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

	setTeamName(name) {
		this._teamName = name;
	},

	setTeamId(id) {
		this._teamId = id;
	},
	
	setTeamAbbv(abbv) {
		this._teamAbbv = abbv;
	},

	setTeamDivisionId(id) {
		this._teamDivisionId = id;
	},

	setTeamConferenceId(id) {
		this._teamConferenceId = id;
	},

	setTeamColorClass(color) {
		this._teamColorClass = color;
	},

	setTeamIcon(icon) {
		this._teamIcon = icon;
	},

	setTimeZone(timeZone) {
		this._timeZone = timeZone;
	}
};

export default CommonUtilities;