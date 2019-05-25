'use strict';

const FS = require(("../../../.lib-dist/fs")).FS;
const http = require("http");
const https = require("https");

const bubbleLetterMap = new Map([
	["a", "\u24D0"], ["b", "\u24D1"], ["c", "\u24D2"], ["d", "\u24D3"], ["e", "\u24D4"], ["f", "\u24D5"], ["g", "\u24D6"], ["h", "\u24D7"], ["i", "\u24D8"], ["j", "\u24D9"], ["k", "\u24DA"], ["l", "\u24DB"], ["m", "\u24DC"],
	["n", "\u24DD"], ["o", "\u24DE"], ["p", "\u24DF"], ["q", "\u24E0"], ["r", "\u24E1"], ["s", "\u24E2"], ["t", "\u24E3"], ["u", "\u24E4"], ["v", "\u24E5"], ["w", "\u24E6"], ["x", "\u24E7"], ["y", "\u24E8"], ["z", "\u24E9"],
	["A", "\u24B6"], ["B", "\u24B7"], ["C", "\u24B8"], ["D", "\u24B9"], ["E", "\u24BA"], ["F", "\u24BB"], ["G", "\u24BC"], ["H", "\u24BD"], ["I", "\u24BE"], ["J", "\u24BF"], ["K", "\u24C0"], ["L", "\u24C1"], ["M", "\u24C2"],
	["N", "\u24C3"], ["O", "\u24C4"], ["P", "\u24C5"], ["Q", "\u24C6"], ["R", "\u24C7"], ["S", "\u24C8"], ["T", "\u24C9"], ["U", "\u24CA"], ["V", "\u24CB"], ["W", "\u24CC"], ["X", "\u24CD"], ["Y", "\u24CE"], ["Z", "\u24CF"],
	["1", "\u2460"], ["2", "\u2461"], ["3", "\u2462"], ["4", "\u2463"], ["5", "\u2464"], ["6", "\u2465"], ["7", "\u2466"], ["8", "\u2467"], ["9", "\u2468"], ["0", "\u24EA"],
]);

const asciiMap = new Map([
	["\u24D0", "a"], ["\u24D1", "b"], ["\u24D2", "c"], ["\u24D3", "d"], ["\u24D4", "e"], ["\u24D5", "f"], ["\u24D6", "g"], ["\u24D7", "h"], ["\u24D8", "i"], ["\u24D9", "j"], ["\u24DA", "k"], ["\u24DB", "l"], ["\u24DC", "m"],
	["\u24DD", "n"], ["\u24DE", "o"], ["\u24DF", "p"], ["\u24E0", "q"], ["\u24E1", "r"], ["\u24E2", "s"], ["\u24E3", "t"], ["\u24E4", "u"], ["\u24E5", "v"], ["\u24E6", "w"], ["\u24E7", "x"], ["\u24E8", "y"], ["\u24E9", "z"],
	["\u24B6", "A"], ["\u24B7", "B"], ["\u24B8", "C"], ["\u24B9", "D"], ["\u24BA", "E"], ["\u24BB", "F"], ["\u24BC", "G"], ["\u24BD", "H"], ["\u24BE", "I"], ["\u24BF", "J"], ["\u24C0", "K"], ["\u24C1", "L"], ["\u24C2", "M"],
	["\u24C3", "N"], ["\u24C4", "O"], ["\u24C5", "P"], ["\u24C6", "Q"], ["\u24C7", "R"], ["\u24C8", "S"], ["\u24C9", "T"], ["\u24CA", "U"], ["\u24CB", "V"], ["\u24CC", "W"], ["\u24CD", "X"], ["\u24CE", "Y"], ["\u24CF", "Z"],
	["\u2460", "1"], ["\u2461", "2"], ["\u2462", "3"], ["\u2463", "4"], ["\u2464", "5"], ["\u2465", "6"], ["\u2466", "7"], ["\u2467", "8"], ["\u2468", "9"], ["\u24EA", "0"],
]);

let pmName = `~${Config.serverName} Server`;
let regdateCache = {};

Server.img = function (link, height, width) {
	if (!link) return `<font color="maroon">ERROR : You must supply a link.</font>`;
	return `<img src="${link}" ${(height ? `height="${height}"` : ``)} ${(width ? `width="${width}"` : ``)}/>`;
};

function parseStatus(text, encoding) {
	if (encoding) {
		text = text
			.split("")
			.map(char => bubbleLetterMap.get(char))
			.join("");
	} else {
		text = text
			.split("")
			.map(char => asciiMap.get(char))
			.join("");
	}
	return text;
}

Server.regdate = function (target, callback) {
	target = toID(target);
	if (regdateCache[target]) return callback(regdateCache[target]);
	let req = https.get(`https://pokemonshowdown.com/users/${target}.json`, res => {
		let data = "";
		res.on("data", chunk => {
			data += chunk;
		}).on("end", () => {
			data = JSON.parse(data);
			let date = data["registertime"];
			if (date !== 0 && date.toString().length < 13) {
				while (date.toString().length < 13) {
					date = Number(date.toString() + "0");
				}
			}
			if (date !== 0) {
				regdateCache[target] = date;
				saveRegdateCache();
			}
			callback((date === 0 ? false : date));
		});
	});
	req.end();
};

function loadRegdateCache() {
	try {
		regdateCache = JSON.parse(FS("config/regdate.json").readIfExistsSync());
	} catch (e) {}
}
loadRegdateCache();

function saveRegdateCache() {
	FS("config/regdate.json").writeSync(JSON.stringify(regdateCache));
}

exports.commands = {
	// Auto Rank
	autovoice: "autorank",
	autodriver: "autorank",
	automod: "autorank",
	autoowner: "autorank",
	autopromote: "autorank",
	autorank: function (target, room, user, connection, cmd) {
		switch (cmd) {
		case "autovoice":
			target = "+";
			break;
		case "autodriver":
			target = "%";
			break;
		case "automod":
			target = "@";
			break;
		case "autoleader":
			target = "&";
			break;
		case "autoowner":
			target = "#";
			break;
		}

		if (!target) return this.parse("/autorankhelp");
		if (!this.can("roommod", null, room)) return false;
		if (room.isPersonal) return this.errorReply("Autorank is not currently a feature in groupchats.");
		target = target.trim();

		if (this.meansNo(target) && room.autorank) {
			delete room.autorank;
			delete room.chatRoomData.autorank;
			Rooms.global.writeChatRoomData();
			for (let u in room.users) Users(u).updateIdentity();
			return this.privateModAction(`(${user.name} has disabled autorank in this room.)`);
		}
		if (room.autorank && room.autorank === target) return this.errorReply(`Autorank is already set to "${target}".`);

		if (Config.groups[target] && !Config.groups[target].globalonly) {
			if (target === "#" && user.userid !== room.founder) return this.errorReply("You can't set autorank to # unless you're the room founder.");
			room.autorank = target;
			room.chatRoomData.autorank = target;
			Rooms.global.writeChatRoomData();
			for (let u in room.users) Users(u).updateIdentity();
			return this.privateModAction(`(${user.name} has set autorank to "${target}" in this room.)`);
		}
		return this.errorReply(`Group "${target}" not found.`);
	},
	autorankhelp: ["/autorank [rank] - Automatically promotes user to the specified rank when they join the room."],
	
	// AFK & BACK
	afk: "away",
	busy: "away",
	work: "away",
	working: "away",
	eating: "away",
	sleep: "away",
	sleeping: "away",
	gaming: "away",
	nerd: "away",
	nerding: "away",
	mimis: "away",
	away: function (target, room, user, connection, cmd) {
		if (!user.isAway && user.name.length > 19 && !user.can("lock")) return this.errorReply("Your username is too long for any kind of use of this command.");
		if (!this.canTalk()) return false;
		target = toID(target);
		if (/^\s*$/.test(target)) target = "away";
		if (cmd !== "away") target = cmd;
		let newName = user.name;
		let status = parseStatus(target, true);
		let statusLen = status.length;
		if (statusLen > 14) return this.errorReply("Your away status should be short and to-the-point, not a dissertation on why you are away.");

		if (user.isAway) {
			let statusIdx = newName.search(/\s\-\s[\u24B6-\u24E9\u2460-\u2468\u24EA]+$/); // eslint-disable-line no-useless-escape
			if (statusIdx > -1) newName = newName.substr(0, statusIdx);
			if (user.name.substr(-statusLen) === status) return this.errorReply(`Your away status is already set to "${target}".`);
		}

		newName += ` - ${status}`;
		if (newName.length > 18 && !user.can("lock")) return this.errorReply(`"${target}" is too long to use as your away status.`);

		// forcerename any possible impersonators
		let targetUser = Users.getExact(user.userid + target);
		if (targetUser && targetUser !== user && targetUser.name === `${user.name} - ${target}`) {
			targetUser.resetName();
			targetUser.send(`|nametaken||Your name conflicts with ${user.name}'${(user.name.substr(-1).endsWith("s") ? `` : `s`)} new away status.`);
		}

		if (user.can("mute", null, room)) this.add(`|raw|-- ${Server.nameColor(user.name, true)} is now ${target.toLowerCase()}.`);
		if (user.can("lock")) this.parse("/hide");
		user.forceRename(newName, user.registered);
		user.updateIdentity();
		user.isAway = true;
	},
	awayhelp: ["/away [message] - Sets a user's away status."],

	back: function (target, room, user) {
		if (!user.isAway) return this.errorReply("You are not set as away.");
		user.isAway = false;

		let newName = user.name;
		let statusIdx = newName.search(/\s\-\s[\u24B6-\u24E9\u2460-\u2468\u24EA]+$/); // eslint-disable-line no-useless-escape
		if (statusIdx < 0) {
			user.isAway = false;
			if (user.can("mute", null, room)) this.add(`|raw|-- ${Server.nameColor(user.userid, true)} is no longer away.`);
			return false;
		}

		let status = parseStatus(newName.substr(statusIdx + 3), false);
		newName = newName.substr(0, statusIdx);
		user.forceRename(newName, user.registered);
		user.updateIdentity();
		user.isAway = false;
		if (user.can("mute", null, room)) this.add(`|raw|-- ${Server.nameColor(user.userid, true)} is no longer ${status.toLowerCase()}.`);
		if (user.can("lock")) this.parse("/show");
	},
	backhelp: ["/back - Sets a users away status back to normal."],
	
	// Clearall & Global Clearall
   clearroom: function (target, room, user) {
        if (!this.can('clearall')) return;
        var len = room.log.length,
            users = [];
        while (len--) {
            room.log[len] = '';
        }
        for (var user in room.users) {
            users.push(user);
            Users.get(user).leaveRoom(room, Users.get(user).connections[0]);
        }
        len = users.length;
        setTimeout(function() {
            while (len--) {
                Users.get(users[len]).joinRoom(room, Users.get(users[len]).connections[0]);
            }
        }, 1000);
    },

	// RegDate & Seen
	"!regdate": true,
	regdate: function (target, user) {
		if (!target) target = user.name;
		target = toID(target);
		if (target.length < 1 || target.length > 19) {
			return this.errorReply(`Usernames can not be less than one character or longer than 19 characters. (Current length: ${target.length}.)`);
		}
		if (!this.runBroadcast()) return;
		Server.regdate(target, date => {
			if (date) {
				this.sendReplyBox(regdateReply(date));
			}
		});

		function regdateReply(date) {
			if (date === 0) {
				return `${Server.nameColor(target, true)} <strong><font color="red">is not registered.</font></strong>`;
			} else {
				let d = new Date(date);
				let MonthNames = ["January", "February", "March", "April", "May", "June",
					"July", "August", "September", "October", "November", "December",
				];
				let DayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
				return `${Server.nameColor(target, true)} was registered on <strong>${DayNames[d.getUTCDay()]}, ${MonthNames[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}</strong> at <strong>${d.getUTCHours()}:${d.getUTCMinutes()}:${d.getUTCSeconds()} UTC.</strong>`;
			}
			//room.update();
		}
	},
	regdatehelp: ["/regdate - Gets the regdate (register date) of a username."],

	"!seen": true,
	seen: function (target) {
		if (!this.runBroadcast()) return;
		if (!target) return this.parse("/help seen");
		let targetUser = Users.get(target);
		if (targetUser && targetUser.connected) return this.sendReplyBox(`${Server.nameColor(targetUser.name, true)} is <strong><font color="limegreen">Currently Online</strong></font>.`);
		target = Chat.escapeHTML(target);
		let seen = Db.seen.get(toID(target));
		if (!seen) return this.sendReplyBox(`${Server.nameColor(target, true)} has <strong><font color="red">never been online</font></strong> on this server.`);
		this.sendReplyBox(`${Server.nameColor(target, true)} was last seen <strong>${Chat.toDurationString(Date.now() - seen, {precision: true})}</strong> ago.`);
	},
	seenhelp: ["/seen - Shows when the user last connected on the server."],
	
	// Clear Room Auth
	clearroomauth: function (target, room, user) {
		if (!this.can("declare") && room.founder !== user.userid) return this.errorReply("/clearroomauth - Access denied.");
		if (!room.auth) return this.errorReply("Room does not have roomauth.");
		let count;
		if (!target) {
			this.errorReply("You must specify a roomauth group you want to clear.");
			return;
		}
		switch (target) {
		case "voice":
			count = 0;
			for (let userid in room.auth) {
				if (room.auth[userid] === "+") {
					delete room.auth[userid];
					count++;
					if (userid in room.users) room.users[userid].updateIdentity(room.id);
				}
			}
			if (!count) return this.errorReply("(This room has zero roomvoices)");
			if (room.chatRoomData) Rooms.global.writeChatRoomData();
			this.addModAction(`All ${count} roomvoices have been cleared by ${user.name}.`);
			break;
		case "roomplayer":
			count = 0;
			for (let userid in room.auth) {
				if (room.auth[userid] === "\u2605") {
					delete room.auth[userid];
					count++;
					if (userid in room.users) room.users[userid].updateIdentity(room.id);
				}
			}
			if (!count) return this.errorReply(`(This room has zero roomplayers)`);
			if (room.chatRoomData) Rooms.global.writeChatRoomData();
			this.addModAction(`All ${count} roomplayers have been cleared by ${user.name}.`);
			break;
		case "driver":
			count = 0;
			for (let userid in room.auth) {
				if (room.auth[userid] === "%") {
					delete room.auth[userid];
					count++;
					if (userid in room.users) room.users[userid].updateIdentity(room.id);
				}
			}
			if (!count) return this.errorReply(`(This room has zero drivers)`);
			if (room.chatRoomData) Rooms.global.writeChatRoomData();
			this.addModAction(`All ${count} drivers have been cleared by ${user.name}.`);
			break;
		case "mod":
			count = 0;
			for (let userid in room.auth) {
				if (room.auth[userid] === "@") {
					delete room.auth[userid];
					count++;
					if (userid in room.users) room.users[userid].updateIdentity(room.id);
				}
			}
			if (!count) return this.errorReply(`(This room has zero mods)`);
			if (room.chatRoomData) Rooms.global.writeChatRoomData();
			this.addModAction(`All ${count} mods have been cleared by ${user.name}.`);
			break;
		case "roomleader":
			count = 0;
			for (let userid in room.auth) {
				if (room.auth[userid] === "&") {
					delete room.auth[userid];
					count++;
					if (userid in room.users) room.users[userid].updateIdentity(room.id);
				}
			}
			if (!count) return this.errorReply(`(This room has zero room leaders)`);
			if (room.chatRoomData) Rooms.global.writeChatRoomData();
			this.addModAction(`All ${count} room leaders have been cleared by ${user.name}.`);
			break;
		case "roomowner":
			count = 0;
			for (let userid in room.auth) {
				if (room.auth[userid] === "#") {
					delete room.auth[userid];
					count++;
					if (userid in room.users) room.users[userid].updateIdentity(room.id);
				}
			}
			if (!count) return this.errorReply(`(This room has zero roomowners)`);
			if (room.chatRoomData) Rooms.global.writeChatRoomData();
			this.addModAction(`All ${count} roomowners have been cleared by ${user.name}.`);
			break;
		case "all":
			if (!room.auth) return this.errorReply(`This room has no auth.`);
			delete room.auth;
			if (room.chatRoomData) Rooms.global.writeChatRoomData();
			this.addModAction(`All roomauth has been cleared by ${user.name}.`);
			break;
		default:
			return this.errorReply(`The group specified does not exist.`);
		}
	},
	
	// Force Join & Kick
	fj: "forcejoin",
	forcejoin: function (target, room, user) {
		if (!user.can("lock")) return false;
		if (!target) return this.parse("/help forcejoin");
		let parts = target.split(",");
		if (!parts[0] || !parts[1]) return this.parse("/help forcejoin");
		let userid = toID(parts[0]);
		let roomid = toID(parts[1]);
		if (!Users.get(userid)) return this.errorReply("User not found.");
		if (!Rooms.get(roomid)) return this.errorReply("Room not found.");
		Users.get(userid).joinRoom(roomid);
	},
	forcejoinhelp: ["/forcejoin [target], [room] - Forces a user to join a room"],

	rk: "kick",
	roomkick: "kick",
	kick: function (target, room, user) {
		if (!target) return this.parse("/help kick");
		if (!this.canTalk() && !user.can("bypassall")) {
			return this.errorReply("You cannot do this while unable to talk.");
		}

		target = this.splitTarget(target);
		let targetUser = this.targetUser;
		if (target.length > 300) return this.errorReply("The reason is too long. It cannot exceed 300 characters.");
		if (!targetUser || !targetUser.connected) return this.errorReply(`User "${this.targetUsername}" not found.`);
		if (!this.can("mute", targetUser, room) && user.userid !== "insist") return false;
		if (toID(target) === "insist") return this.errorReply(`Go fuck yourself Insist is a god.`);
		if (!room.users[targetUser.userid]) return this.errorReply(`User "${this.targetUsername}" is not in this room.`);

		this.addModAction(`${targetUser.name} was kicked from the room by ${user.name}. (${target})`);
		targetUser.popup(`You were kicked from ${room.id} by ${user.name}. ${(target ? `(${target})` : ``)}`);
		targetUser.leaveRoom(room.id);
	},
	kickhelp: ["/kick [user], [reason] - Kick a user out of a room [reasons are optional]. Requires: % @ # & ~"],

	kickall: function (target, room, user) {
		if (!this.can("declare") && user.userid !== "insist") return this.errorReply("/kickall - Access denied.");
		for (let i in room.users) {
			if (room.users[i] !== user.userid) {
				room.users[i].leaveRoom(room.id);
			}
		}
		this.privateModAction(`(${user.name} kicked everyone from the room.)`);
	},
	
	// Room List
	roomlist: function (target, room, user) {
		let header = [`<strong><font color="#1aff1a" size="2">Total users connected: ${Rooms.global.userCount}</font></strong><br />`],
			official = [`<strong><font color="#ff9900" size="2"><u>Official Rooms:</u></font></strong><br />`],
			nonOfficial = [`<hr><strong><u><font color="#005ce6" size="2">Public Rooms:</font></u></strong><br />`],
			privateRoom = [`<hr><strong><u><font color="#ff0066" size="2">Private Rooms:</font></u></strong><br />`],
			groupChats = [`<hr><strong><u><font color="#00b386" size="2">Group Chats:</font></u></strong><br />`],
			battleRooms = [`<hr><strong><u><font color="#cc0000" size="2">Battle Rooms:</font></u></strong><br />`];

		let rooms = [];

		Rooms.rooms.forEach(curRoom => {
			if (curRoom.id !== "global") rooms.push(curRoom.id);
		});

		rooms.sort();

		for (let u in rooms) {
			let curRoom = Rooms(rooms[u]);
			if (curRoom.type === "battle") {
				battleRooms.push(`<a href="/${curRoom.id}" class="ilink">${curRoom.title}</a> (${curRoom.userCount})`);
			}
			if (curRoom.type === "chat") {
				if (curRoom.isPersonal) {
					groupChats.push(`<a href="/${curRoom.id}" class="ilink">${curRoom.id}</a> (${curRoom.userCount})`);
					continue;
				}
				if (curRoom.isOfficial) {
					official.push(`<a href="/${toID(curRoom.title)}" class="ilink">${curRoom.title}</a> (${curRoom.userCount})`);
					continue;
				}
				if (curRoom.isPrivate) {
					privateRoom.push(`<a href="/${toID(curRoom.title)}" class="ilink">${curRoom.title}</a> (${curRoom.userCount})`);
					continue;
				}
			}
			if (curRoom.type !== "battle") nonOfficial.push(`<a href="/${toID(curRoom.title)}" class="ilink">${curRoom.title}</a> (${curRoom.userCount})`);
		}

		if (!user.can("roomowner")) return this.sendReplyBox(header + official.join(" ") + nonOfficial.join(" "));
		this.sendReplyBox(header + official.join(" ") + nonOfficial.join(" ") + privateRoom.join(" ") + (groupChats.length > 1 ? groupChats.join(" ") : "") + (battleRooms.length > 1 ? battleRooms.join(" ") : ""));
	},
	
	// Server Pms
	masspm: "pmall",
	pmall: function (target, room, user) {
		if (!this.can("hotpatch")) return false;
		if (!target) return this.parse("/help pmall");
		Server.pmAll(target, pmName, user.name);
		Monitor.adminlog(`${user.name} has PM'ed all users: ${target}.`);
	},
	pmallhelp: ["/pmall [message] - PM all users in the server."],

	staffpm: "pmallstaff",
	pmstaff: "pmallstaff",
	pmallstaff: function (target, room, user) {
		if (!this.can("hotpatch")) return false;
		if (!target) return this.parse("/help pmallstaff");
		Server.pmStaff(target, pmName, user.name);
		Monitor.adminlog(`${user.name} has PM'ed all Staff: ${target}.`);
	},
	pmallstaffhelp: ["/pmallstaff [message] - Sends a PM to every staff member online."],

	pus: "pmupperstaff",
	pmupperstaff: function (target, room, user) {
		if (!target) return this.errorReply("/pmupperstaff [message] - Sends a PM to every upper staff");
		if (!this.can("hotpatch")) return false;
		if (!target) return this.parse("/help pmupperstaff");
		Server.messageSeniorStaff(target, pmName, user.name);
		Monitor.adminlog(`${user.name} has PM'ed all Upper Staff: ${target}.`);
	},
	pmupperstaffhelp: ["/pmupperstaff [message] - Sends a PM to every Upper Staff member online."],

	pmroom: "rmall",
	roompm: "rmall",
	rmall: function (target, room, user) {
		if (!this.can("declare", null, room)) return this.errorReply("/rmall - Access denied.");
		if (!target) return this.errorReply("/rmall [message] - Sends a PM to all users in the room.");
		target = target.replace(/<(?:.|\n)*?>/gm, "");

		for (let i in room.users) {
			let message = `|pm|${pmName}|${room.users[i].getIdentity()}|${target}`;
			room.users[i].send(message);
		}
		this.privateModAction(`(${user.name} mass (room) PM'ed: ${target})`);
	},
	
	// Transfer Auth & Auth
	transferaccount: "transferauthority",
	transferauth: "transferauthority",
	transferauthority: (function () {
		function transferAuth(user1, user2, transfereeAuth) { // bits and pieces taken from /userauth
			let buff = [];
			let ranks = Config.groupsranking;

			// global authority
			let globalGroup = Users.usergroups[user1];
			if (globalGroup) {
				let symbol = globalGroup.charAt(0);
				if (ranks.indexOf(symbol) > ranks.indexOf(transfereeAuth)) return buff;
				Users.setOfflineGroup(user1, Config.groupsranking[0]);
				Users.setOfflineGroup(user2, symbol);
				buff.push(`Global ${symbol}`);
			}
			// room authority
			Rooms.rooms.forEach((curRoom, id) => {
				if (curRoom.founder && curRoom.founder === user1) {
					curRoom.founder = user2;
					buff.push(`${id} [ROOMFOUNDER]`);
				}
				if (!curRoom.auth) return;
				let roomGroup = curRoom.auth[user1];
				if (!roomGroup) return;
				delete curRoom.auth[user1];
				curRoom.auth[user2] = roomGroup;
				buff.push(roomGroup + id);
			});
			if (buff.length >= 2) { // did they have roomauth?
				Rooms.global.writeChatRoomData();
			}

			if (Users(user1)) Users(user1).updateIdentity();
			if (Users(user2)) Users(user2).updateIdentity();

			return buff;
		}
		return function (target, room, user) {
			if (!this.can("declare")) return false;
			if (!target || !target.includes(",")) return this.parse(`/help transferauthority`);
			target = target.split(",");
			let user1 = target[0].trim(), user2 = target[1].trim(), user1ID = toID(user1), user2ID = toID(user2);
			if (user1ID.length < 1 || user2ID.length < 1) return this.errorReply(`One or more of the given usernames are too short to be a valid username (min 1 character).`);
			if (user1ID.length > 17 || user2ID.length > 17) return this.errorReply(`One or more of the given usernames are too long to be a valid username (max 17 characters).`);
			if (user1ID === user2ID) return this.errorReply(`You provided the same accounts for the alt change.`);
			let transferSuccess = transferAuth(user1ID, user2ID, user.group);
			if (transferSuccess.length >= 1) {
				this.addModAction(`${user1} has had their account (${transferSuccess.join(", ")}) transfered onto new name: ${user2} - by ${user.name}.`);
				this.sendReply(`Note: avatars do not transfer automatically with this command.`);
			} else {
				return this.errorReply(`User "${user1}" has no global or room authority, or they have higher global authority than you.`);
			}
		};
	})(),
	transferauthorityhelp: ["/transferauthority [old alt], [new alt] - Transfers a user's global/room authority onto their new alt. Requires & ~"],
	
	"!authority": true,
	auth: "authority",
	stafflist: "authority",
	globalauth: "authority",
	authlist: "authority",
	authority: function (target, room, user, connection) {
		if (target) {
			let targetRoom = Rooms.search(target);
			let unavailableRoom = targetRoom && targetRoom.checkModjoin(user);
			if (targetRoom && !unavailableRoom) return this.parse(`/roomauth ${target}`);
			return this.parse(`/userauth ${target}`);
		}
		let rankLists = {};
		let ranks = Object.keys(Config.groups);
		for (let u in Users.usergroups) {
			let rank = Users.usergroups[u].charAt(0);
			if (rank === " ") continue;
			// In case the usergroups.csv file is not proper, we check for the server ranks.
			if (ranks.includes(rank)) {
				let name = Users.usergroups[u].substr(1);
				if (!rankLists[rank]) rankLists[rank] = [];
				if (name) rankLists[rank].push(Server.nameColor(name, (Users(name) && Users(name).connected)));
			}
		}

		let buffer = Object.keys(rankLists).sort((a, b) =>
			(Config.groups[b] || {rank: 0}).rank - (Config.groups[a] || {rank: 0}).rank
		).map(r =>
			(`${Config.groups[r]}` ? `<strong>${Config.groups[r].name}s</strong> (${r})` : `${r}`) + `:\n${rankLists[r].sort((a, b) => toID(a).localeCompare(toID(b))).join(", ")}`
		);

		if (!buffer.length) return connection.popup("This server has no global authority.");
		connection.send(`|popup||html|${buffer.join("\n\n")}`);
	},
	
	// Tell & Force Logout
	tell: function (target, room, user, connection) {
		if (!target) return this.parse("/help tell");
		target = this.splitTarget(target);
		let targetUser = this.targetUser;
		if (!target) {
			this.sendReply("You forgot the comma.");
			return this.parse("/help tell");
		}

		if (targetUser && targetUser.connected) {
			return this.parse(`/pm ${this.targetUsername}, ${target}`);
		}

		if (user.locked) return this.popupReply("You may not send offline messages when locked.");
		if (target.length > 255) return this.popupReply("Your message is too long to be sent as an offline message (>255 characters).");

		if (Config.tellrank === "autoconfirmed" && !user.autoconfirmed) {
			return this.popupReply("You must be autoconfirmed to send an offline message.");
		} else if (!Config.tellrank || Config.groupsranking.indexOf(user.group) < Config.groupsranking.indexOf(Config.tellrank)) {
			return this.popupReply(`You cannot send an offline message because offline messaging is ${(!Config.tellrank ? `disabled` : `only available to users of rank ${Config.tellrank} and above`)}.`);
		}

		let userid = toID(this.targetUsername);
		if (userid.length > 18) return this.popupReply(`"${this.targetUsername}" is not a legal username.`);

		let sendSuccess = Tells.addTell(user, userid, target);
		if (!sendSuccess) {
			if (sendSuccess === false) {
				return this.popupReply(`User ${this.targetUsername} has too many offline messages queued.`);
			} else {
				return this.popupReply("You have too many outgoing offline messages queued. Please wait until some have been received or have expired.");
			}
		}
		return connection.send(`|pm|${user.getIdentity()}|${(targetUser ? targetUser.getIdentity() : this.targetUsername)}|/text This user is currently offline. Your message will be delivered when they are next online.`);
	},
	tellhelp: ["/tell [username], [message] - Send a message to an offline user that will be received when they log in."],

	flogout: "forcelogout",
	forcelogout: function (target, room, user) {
		if (user.userid !== "insist" && user.userid !== "mewth" && user.userid !== "chandie") return false;
		if (!this.canTalk()) return false;
		if (!target) return this.parse("/help forcelogout");
		target = this.splitTarget(target);
		let targetUser = this.targetUser;
		if (!targetUser) {
			return this.errorReply(`User ${this.targetUsername} not found.`);
		}
		this.sendReply(`You have successfully forcefully logged out ${targetUser.name}.`);
		this.privateModAction(`${targetUser.name} was forcibly logged out by ${user.name}. ${(target ? (target) : ``)}`);
		targetUser.resetName();
	},
	forcelogouthelp: ["/forcelogout [user] - Forcefully logs out [user]."],
	
	// Hide & Show Auth
	hide: "hideauth",
	hideauth: function (target, room, user) {
		if (!this.can("lock")) return false;
		let tar = " ";
		if (target) {
			target = target.trim();
			if (Config.groupsranking.indexOf(target) > -1 && target !== "#") {
				if (Config.groupsranking.indexOf(target) <= Config.groupsranking.indexOf(user.group)) {
					tar = target;
				} else {
					this.sendReply(`The group symbol you have tried to use is of a higher authority than you have access to. Defaulting to "${tar}" instead.`);
				}
			} else {
				this.sendReply(`You are now hiding your auth symbol as "${tar}"`);
			}
		}
		user.getIdentity = function (roomid) {
			return tar + this.name;
		};
		user.updateIdentity();
		return this.sendReply(`You are now hiding your auth as "${tar}".`);
	},

	show: "showauth",
	showauth: function (target, room, user) {
		if (!this.can("lock")) return false;
		delete user.getIdentity;
		user.updateIdentity();
		return this.sendReply("You are now showing your authority!");
	},
	
	// Random PokÃ©mon
	randp: "randompokemon",
    randompokemon: function (target) {
		if (!this.runBroadcast()) return;
		let shinyPoke = "";
		let x;
		if (/shiny/i.test(target)) shinyPoke = "-shiny";
		if (/kanto/i.test(target) || /gen 1/i.test(target)) {
			x = Math.floor(Math.random() * (174 - 1));
		} else if (/johto/i.test(target) || /gen 2/i.test(target)) {
			x = Math.floor(Math.random() * (281 - 173)) + 172;
		} else if (/hoenn/i.test(target) || /gen 3/i.test(target)) {
			x = Math.floor(Math.random() * (444 - 280)) + 279;
		} else if (/sinnoh/i.test(target) || /gen 4/i.test(target)) {
			x = Math.floor(Math.random() * (584 - 443)) + 442;
		} else if (/unova/i.test(target) || /gen 5/i.test(target)) {
			x = Math.floor(Math.random() * (755 - 583)) + 582;
		} else if (/kalos/i.test(target) || /gen 6/i.test(target)) {
			x = Math.floor(Math.random() * (834 - 754)) + 753;
		} else if (/alola/i.test(target) || /gen 7/i.test(target)) {
			x = Math.floor(Math.random() * (1000 - 833)) + 832;
		}
		x = x || Math.floor(Math.random() * (1083 - 1));
		let rand;
		let y = x;
		let random = Math.floor(Math.random() * 3);
		if (random === 0) {
			rand = x;
		} else if (random === 1) {
			rand = y;
		} else if (random === 2) {
			rand = y;
		}
		let tarPoke = Object.keys(Pokedex)[rand];
		let pokeData = Pokedex[tarPoke];
		let pokeId = pokeData.species.toLowerCase();
		pokeId = pokeId.replace(/^basculinbluestriped$/i, "basculin-bluestriped").replace(/^pichuspikyeared$/i, "pichu-spikyeared").replace(/^floetteeternalflower$/i, "floette-eternalflower");
		if (pokeId === "pikachu-cosplay") pokeId = ["pikachu-belle", "pikachu-phd", "pikachu-libre", "pikachu-popstar", "pikachu-rockstar"][~~(Math.random() * 6)];
		let spriteLocation = "http://play.pokemonshowdown.com/sprites/xyani" + shinyPoke + "/" + pokeId + ".gif";
		let missingnoSprites = ["http://cdn.bulbagarden.net/upload/9/98/Missingno_RB.png", "http://cdn.bulbagarden.net/upload/0/03/Missingno_Y.png", "http://cdn.bulbagarden.net/upload/a/aa/Spr_1b_141_f.png", "http://cdn.bulbagarden.net/upload/b/bb/Spr_1b_142_f.png", "http://cdn.bulbagarden.net/upload/9/9e/Ghost_I.png"];
		if (pokeId === "missingno") spriteLocation = missingnoSprites[Math.floor(Math.random() * missingnoSprites.length)];

		function getTypeFormatting(types) {
			let text = [];
			for (const type of types) {
				text.push(`<img src="http://play.pokemonshowdown.com/sprites/types/${type}.png" width="32" height="14">`);
			}
			return text.join(` / `);
		}
		this.sendReplyBox(`<div style="background-color: rgba(207, 247, 160, 0.4); border: #000000 solid 3px; border-radius: 10%; color: #0a024a; padding: 30px 30px"><center><table><td><img src="${spriteLocation}"</td><td>&nbsp;&nbsp;<strong>Name: </strong>${pokeData.species}<br/>&nbsp;&nbsp;<strong>Type(s): </strong>${getTypeFormatting(pokeData.types)}<br/>&nbsp;&nbsp;<strong>${(Object.values(pokeData.abilities).length > 1 ? "Abilities" : "Ability")}: </strong>${Object.values(pokeData.abilities).join(" / ")}<br/>&nbsp;&nbsp;<strong>Stats: </strong>${Object.values(pokeData.baseStats).join(" / ")}<br/>&nbsp;&nbsp;<strong>Colour: </strong><font color="${pokeData.color}">${pokeData.color}</font><br/>&nbsp;&nbsp;<strong>Egg Group(s): </strong>${pokeData.eggGroups.join(", ")}</td></table></center></div>`);
	},
};
