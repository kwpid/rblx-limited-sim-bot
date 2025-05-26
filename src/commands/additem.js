const { SlashCommandBuilder } = require('discord.js');
const rolimonsApi = require('../utils/rolimonsApi');
const db = require('../utils/databaseManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('additem')
        .setDescription('Add a Roblox limited item to the database')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Item name or ID to search for')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const query = interaction.options.getString('query');
            const items = await rolimonsApi.searchItems(query);

            if (!items || items.length === 0) {
                return interaction.editReply('No items found matching your search.');
            }

            // If we found exactly one item, add it directly
            if (items.length === 1) {
                const item = items[0];
                await db.addItem(item);
                return interaction.editReply(`Added item: **${item.name}**\nValue: R$ ${item.value.toLocaleString()}\nRAP: R$ ${item.rap.toLocaleString()}`);
            }

            // If multiple items found, show a list
            const itemList = items.slice(0, 10).map((item, index) => 
                `${index + 1}. ${item.name} (Value: R$ ${item.value.toLocaleString()})`
            ).join('\n');

            await interaction.editReply(
                `Multiple items found. Please use the item ID to add a specific item:\n\n${itemList}\n\nUse \`/additem <item_id>\` to add a specific item.`
            );
        } catch (error) {
            console.error('Error adding item:', error);
            await interaction.editReply('Failed to add item. Please try again later.');
        }
    },
}; 