const discordToken: string | undefined = process.env.DISCORD_API_TOKEN;

if (!discordToken || discordToken === 'YOUR_DISCORD_TOKEN') {
	console.error('No discord token provided');
	process.exit(1);
}

import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import commandsMap from './commands';
import fs from 'fs/promises';
import { Database } from 'bun:sqlite';

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
	]
})

console.log(`Refreshing ${commandsMap.size} commands...`)
const rest = new REST().setToken(discordToken);
const getAppId: any = await rest.get(Routes.currentApplication()) || { id: null };
if (!getAppId?.id) {
	console.error('Could not get application id');
	process.exit(1);
}

// Create a new "roles" table
export const db = new Database('./bot/database.sqlite');
db.run(`
	CREATE TABLE IF NOT EXISTS roles (
		guild_id TEXT,
		user_id TEXT,
		roles_id TEXT
	)
`);

console.log('Roles table created successfully!');

const data: any = await rest.put(
	Routes.applicationCommands(getAppId.id),
	{
		body: [...commandsMap.values()].map((command) => command.data)
	}
)

console.log(`Successfully refreshed ${data.length} commands!`)

client.login(discordToken);

export default client;

const getEventFiles = await fs.readdir('./bot/events');
await Promise.all(getEventFiles.map(async (file) => { await import (`./events/${file}`) }));