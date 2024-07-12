// Commands taken from https://github.com/NiaAxern/discord-youtube-subscriber-count/blob/main/src/commands/utilities.ts

import { heapStats } from 'bun:jsc';
import client from '.';
import type { CommandInteraction } from 'discord.js';
import { db } from '.';

interface Command {
	data: {
		options: any[];
		name: string;
		description: string;
		integration_types: number[];
		contexts: number[];
	};
	execute: (interaction: CommandInteraction) => Promise<void>;
}

const commands: Record<string, Command> = {
	ping: {
		data: {
			options: [],
			name: 'ping',
			description: 'Check the ping of the bot!',
			integration_types: [0, 1],
			contexts: [0, 1, 2],
		},
		execute: async (interaction: CommandInteraction) => {
			await interaction
				.reply({
					ephemeral: false,
					content: `Ping: ${interaction.client.ws.ping}ms`,
				})
				.catch(console.error);
		},
	},
	help: {
		data: {
			options: [],
			name: 'help',
			description: 'Get help on what each command does!',
			integration_types: [0, 1],
			contexts: [0, 1, 2],
		},
		execute: async (interaction: CommandInteraction) => {
			await client.application?.commands?.fetch().catch(console.error);
			const chat_commands = client.application?.commands.cache.map((a) => {
				return `</${a.name}:${a.id}>: ${a.description}`;
			});
			await interaction
				.reply({
					ephemeral: true,
					content: `Commands:\n${chat_commands?.join('\n')}`,
				})
				.catch(console.error);
		},
	},
	sourcecode: {
	    data: {
	        options: [],
	        name: 'sourcecode',
	        description: "Get the link of the app's source code.",
	        integration_types: [0, 1],
	        contexts: [0, 1, 2],
	    },
	    execute: async (interaction: CommandInteraction) => {
	        await interaction
	            .reply({
	                ephemeral: true,
	                content: `[Github repository](https://github.com/GalvinPython/persist-discord)`,
	            })
	            .catch(console.error);
	    },
	},
	uptime: {
		data: {
			options: [],
			name: 'uptime',
			description: 'Check the uptime of the bot!',
			integration_types: [0, 1],
			contexts: [0, 1, 2],
		},
		execute: async (interaction: CommandInteraction) => {
			await interaction
				.reply({
					ephemeral: false,
					content: `Uptime: ${(performance.now() / (86400 * 1000)).toFixed(
						2,
					)} days`,
				})
				.catch(console.error);
		},
	},
	usage: {
		data: {
			options: [],
			name: 'usage',
			description: 'Check the heap size and disk usage of the bot!',
			integration_types: [0, 1],
			contexts: [0, 1, 2],
		},
		execute: async (interaction: CommandInteraction) => {
			const heap = heapStats();
			Bun.gc(false);
			await interaction
				.reply({
					ephemeral: false,
					content: [
						`Heap size: ${(heap.heapSize / 1024 / 1024).toFixed(2)} MB / ${(
							heap.heapCapacity /
							1024 /
							1024
						).toFixed(2)} MB (${(heap.extraMemorySize / 1024 / 1024).toFixed(2,)} MB) (${heap.objectCount.toLocaleString()} objects, ${heap.protectedObjectCount.toLocaleString()} protected-objects)`,
					]
						.join('\n')
						.slice(0, 2000),
				})
				.catch(console.error);
		},
	},
	add: {
		data: {
			options: [
				{
					name: 'member',
					id: 'member',
					description: 'The member to add the role to',
					type: 6,
					required: true,
					choices: [],
				},
				{
					name: 'role',
					id: 'role',
					description: 'The role to add to the member',
					type: 8,
					required: true,
					choices: [],
				}
			],
			name: 'add',
			description: 'Add a new member and target role to them',
			integration_types: [0, 1],
			contexts: [0, 1, 2],
		},
		execute: async (interaction: CommandInteraction) => {
			if (!interaction.memberPermissions?.has('ManageRoles')) {
				await interaction.reply({ content: 'You do not have permission to use this command', ephemeral: true });
				return
			};

			const member = interaction.options.get('member')?.value;
			const role = interaction.options.get('role')?.value;
			const guildId = interaction.guild?.id;

			console.log(member, role, guildId)

			if (!member || !role || !guildId) {
				await interaction.reply({ content: 'Invalid member or role', ephemeral: true });
				return
			};

			const rows = db.query(`SELECT roles_id FROM roles WHERE guild_id = $guildId AND user_id = $userId`).values({
				$guildId: guildId,
				$userId: member,
			})

			if (rows.length === 0) {
				const newRoles = [role];
				db.query(`INSERT INTO roles (guild_id, user_id, roles_id) VALUES ($guildId, $userId, $roles)`).values({
					$guildId: guildId,
					$userId: member,
					$roles: JSON.stringify(newRoles),
				})
				await interaction.reply({ content: 'Role added to member', ephemeral: true });
			} else {
				const existingRoles = JSON.parse(rows[0][0] as string);
				if (existingRoles.includes(role)) {
					await interaction.reply({ content: 'Role already exists for this member', ephemeral: true });
					return;
				} else {
					existingRoles.push(role);
					db.query(`UPDATE roles SET roles_id = $roles WHERE guild_id = $guildId AND user_id = $userId`).values({
						$roles: JSON.stringify(existingRoles),
						$guildId: guildId,
						$userId: member,
					})
					await interaction.reply({ content: 'Role added to member', ephemeral: true });
				}
			}
		}
	}
};

// Convert commands to a Map
const commandsMap = new Map<string, Command>();
for (const key in commands) {
	if (Object.prototype.hasOwnProperty.call(commands, key)) {
		const command = commands[key];
		console.log('loading ' + key);
		commandsMap.set(key, command);
	}
}

export default commandsMap;