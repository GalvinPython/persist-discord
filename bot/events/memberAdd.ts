import { Events } from 'discord.js';
import client from '../index';

import { db } from '../index';

client.on(Events.GuildMemberAdd, async (member) => {
	console.log('Member joined!');
	const rows = db.query('SELECT roles_id FROM roles WHERE guild_id = $guildId AND user_id = $userId').values({
		$guildId: member.guild.id,
		$userId: member.id,
	});
	console.log(rows);
	const roles = JSON.parse(rows[0][0] as string);
	console.log(roles);
	roles.forEach((role: string) => {
		const getRole = member.guild.roles.cache.get(role);
		if (!getRole) return;
		member.roles.add(getRole);
	});
});