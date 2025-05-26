const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

// Check for required environment variables
if (!process.env.DISCORD_TOKEN) {
    console.error('Missing DISCORD_TOKEN environment variable');
    process.exit(1);
}

if (!process.env.GUILD_ID) {
    console.error('Missing GUILD_ID environment variable');
    process.exit(1);
}

if (!process.env.CLIENT_ID) {
    console.error('Missing CLIENT_ID environment variable');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Initialize commands collection
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Initialize database
const { initializeDatabase } = require('./models');
const db = require('./utils/databaseManager');

// Register slash commands
async function registerCommands() {
    try {
        const { REST, Routes } = require('discord.js');
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);

        const commands = [];
        for (const file of commandFiles) {
            const command = require(`./commands/${file}`);
            commands.push(command.data.toJSON());
        }

        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

client.once(Events.ClientReady, async () => {
    try {
        // Initialize database
        await initializeDatabase();
        console.log('Database models synchronized.');

        // Register commands
        await registerCommands();

        // Verify bot is in the correct guild
        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        if (!guild) {
            console.error(`Bot is not in the specified guild (${process.env.GUILD_ID})`);
            process.exit(1);
        }

        console.log(`Ready! Logged in as ${client.user.tag}`);
    } catch (error) {
        console.error('Error during startup:', error);
        process.exit(1);
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    // Check if command is used in the correct guild
    if (interaction.guildId !== process.env.GUILD_ID) {
        return interaction.reply({ 
            content: 'This bot can only be used in the specified server.', 
            ephemeral: true 
        });
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

// Error handling
client.on('error', error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.login(process.env.DISCORD_TOKEN); 