/******************************
* Icons for Pokemon Showdown  *
* Credits: Lord Haji, panpawn.*
*******************************/
"use strict";

const FS = require(("../../../.lib-dist/fs")).FS;
/* Icons Functions */

let iconsData = FS("server/impulse/database/icons.json").readIfExistsSync();
let icons = {};

if (iconsData) {
	icons = JSON.parse(iconsData);
}

function updateIcons() {
	FS("server/impulse/database/icons.json").writeUpdate(() => (
		JSON.stringify(icons)
	));

	let newCss = "/* ICONS START */\n";

	for (let name in icons) {
		newCss += generateCSS(name, icons[name]);
	}
	newCss += "/* ICONS END */\n";

	let file = FS("config/custom.css").readIfExistsSync().split("\n");
	if (file.includes("/* ICONS START */")) file.splice(file.indexOf("/* ICONS START */"), (file.indexOf("/* ICONS END */") - file.indexOf("/* ICONS START */")) + 1);
	FS("config/custom.css").writeUpdate(() => (
		file.join("\n") + newCss
	));
	Server.reloadCSS();
}

function generateCSS(name, icon) {
	let css = "";
	name = toID(name);
	css = `[id$="-userlist-user-${name}"] {\nbackground: rgba(17, 72, 79, 0.6) url("${icon}") right no-repeat !important;\n}\n`;
	return css;
}
/* End Icon Functions */
/* SymbolColor Functions */
let sc = FS("server/impulse/database/symbolcolors.json").readIfExistsSync();

if (sc !== "") {
	sc = JSON.parse(sc);
} else {
	sc = {};
}

function updateSC() {
	FS("server/impulse/database/symbolcolors.json").writeUpdate(() => (
		JSON.stringify(sc)
	));

	let newCss = `/* Symbol Colors START */\n`;

	for (let name in sc) {
		newCss += genCSS(name, sc[name]);
	}
	newCss += `/* Symbol Colors END */\n`;

	let file = FS("config/custom.css").readIfExistsSync().split("\n");
	if (~file.indexOf("/* Symbol Colors START */")) file.splice(file.indexOf("/* Symbol Colors START */"), (file.indexOf("/* Symbol Colors END */") - file.indexOf("/* Symbol Colos START */")) + 1);
	FS("config/custom.css").writeUpdate(() => (
		file.join("\n") + newCss
	));
	Server.reloadCSS();
}

function genCSS(name, sc) {
	let css = ``;
	name = toID(name);
	css = `[id*="-userlist-user-${name}"] button > em.group {/ncolor: ${sc} !important;/n}/n`;
	return css;
}
/* SymbolColor Functions End */

exports.commands = {
	uli: "icon",
	userlisticon: "icon",
	customicon: "icon",
	icon: {
		set: function (target, room, user) {
			if (!this.can('icon')) return false;
			target = target.split(',');
			for (let u in target) target[u] = target[u].trim();
			if (target.length !== 2) return this.parse("/help icon");
			if (toID(target[0]).length > 19) return this.errorReply("Usernames are not this long...");
			if (icons[toID(target[0])]) return this.errorReply("This user already has a custom userlist icon.  Do /icon delete [user] and then set their new icon.");
			this.sendReply(`|raw|You have given ${Server.nameColor(target[0], true)} an icon.`);
			Monitor.log(`${target[0]} has received an icon from ${user.name}.`);
			this.privateModAction(`|raw|(${target[0]} has received icon: <img src="${target[1]}" width="32" height="32"> from ${user.name}.)`);
			this.modlog("ICON", target[0], `Set icon to ${target[1]}`);
			if (Users(toID(target[0])) && Users(toID(target[0])).connected) Users(target[0]).popup(`|html|${Server.nameColor(user.name, true)} has set your userlist icon to: <img src="${target[1]}" width="32" height="32"><br /><center>Refresh, If you don't see it.</center>`);
			icons[toID(target[0])] = target[1];
			updateIcons();
		},

		remove: "delete",
		delete: function (target, room, user) {
			if (!this.can('icon')) return false;
			target = toID(target);
			if (!icons[toID(target)]) return this.errorReply(`/icon - ${target} does not have an icon.`);
			delete icons[toID(target)];
			updateIcons();
			this.sendReply(`You removed ${target}'s icon.`);
			Monitor.log(`${user.name} removed ${target}'s icon.`);
			this.privateModAction(`(${target}'s icon was removed by ${user.name}.)`);
			this.modlog("ICON", target, `Removed icon`);
			if (Users(toID(target)) && Users(toID(target)).connected) Users(target).popup(`|html|${Server.nameColor(user.name, true)} has removed your userlist icon.`);
		},

		"": "help",
		help: function (target, room, user) {
			this.parse("/iconhelp");
		},
	},
	
	/* Symbol Color Commands */
	symbolcolor: "sc",
	sc: {
		give: "set",
		set: function (target, room, user) {
			if (!this.can("profile")) return false;
			target = target.split(",");
			for (let u in target) target[u] = target[u].trim();
			if (target.length !== 2) return this.parse("/sc help");
			if (toID(target[0]).length > 19) return this.errorReply("Usernames are not this long...");
			if (sc[toID(target[0])]) return this.errorReply("This user already has a custom sc.  Do /sc delete [user] and then set their new symbol color.");
			this.sendReply(`|raw|You have given ${Server.nameColor(target[0], true)} an symbol color.`);
			Monitor.log(`${target[0]} has received an symbol color from ${user.name}.`);
			this.privateModAction(`|raw|(${Server.nameColor(target[0], true)} has received a symbol color: <font color="${target[1]}">${target[1]}</font> from ${user.name}.)`);
			if (Users(target[0]) && Users(target[0]).connected) Users(target[0]).popup(`|html|${Server.nameColor(user.name, true)} has set your symbol color to: <font color="${target[1]}">${target[1]}</font>.<br /><center>Refresh, If you don't see it.</center>`);
			sc[toID(target[0])] = target[1];
			updateSC();
		},

		take: "delete",
		remove: "delete",
		delete: function (target, room, user) {
			if (!this.can("profile")) return false;
			target = toID(target);
			if (!sc[target]) return this.errorReply(`/sc - ${target} does not have an symbol color.`);
			delete sc[target];
			updateSC();
			this.sendReply(`You removed ${target}'s symbol color.`);
			Monitor.log(`${user.name} removed ${target}'s symbol color.`);
			this.privateModAction(`(${target}'s symbol color was removed by ${user.name}.)`);
			if (Users(target) && Users(target).connected) Users(target).popup(`|html|${Server.nameColor(user.name, true)} has removed your symbol color.`);
		},

		'': 'help',
		help: function (target, room, user) {
			this.sendReplyBox(
				'<div style="padding: 3px 5px;"><center>' +
				'<code>/sc</code> commands.<br />These commands are nestled under the namespace <code>sc</code>.</center>' +
				'<hr width="100%">' +
				'<code>set [username], [color]</code>: Gives <code>username</code> custom symbol color. Requires: & ~' +
				'<br />' +
				'<code>delete [username]</code>: Takes <code>username</code>\'s custom symbol color. Requires: & ~' +
				'<br />' +
				'<code>help</code>: Shows this command.' +
				'</div>'
			);
		},
	},
	/* Symbol Color Commands End */

	iconhelp: [
		"Commands Include:",
		"/icon set [user], [image url] - Gives [user] an icon of [image url]",
		"/icon delete [user] - Deletes a user's icon",
	],
};
