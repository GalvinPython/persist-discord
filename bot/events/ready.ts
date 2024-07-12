import { Events } from 'discord.js'
import client from '..'

client.once(Events.ClientReady, (bot) => {
	console.log(`Logged in as ${bot.user?.tag}`)
})