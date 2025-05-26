const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
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

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
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
    }
}

// Initialize database
const { initializeDatabase } = require('./models');
const db = require('./utils/databaseManager');

client.once(Events.ClientReady, async () => {
    try {
        await initializeDatabase();
        console.log('Database initialized successfully');
        
        // Verify bot is in the correct guild
        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        if (!guild) {
            console.error(`Bot is not in guild with ID: ${process.env.GUILD_ID}`);
            process.exit(1);
        }
        
        console.log(`Logged in as ${client.user.tag}`);
        console.log(`Connected to guild: ${guild.name}`);
    } catch (error) {
        console.error('Failed to initialize database:', error);
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
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.login(process.env.DISCORD_TOKEN); 