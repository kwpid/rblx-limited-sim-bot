const { SlashCommandBuilder } = require('discord.js');
const db = require('../utils/databaseManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('additem')
        .setDescription('Add a new item to the database')
        .addStringOption(option =>
            option.setName('itemid')
                .setDescription('The unique ID for the item')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the item')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('imageurl')
                .setDescription('The URL of the item image')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('value')
                .setDescription('The value of the item')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('rap')
                .setDescription('The RAP of the item')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('rarity')
                .setDescription('The rarity of the item')
                .setRequired(true)
                .addChoices(
                    { name: 'Common', value: 'common' },
                    { name: 'Uncommon', value: 'uncommon' },
                    { name: 'Rare', value: 'rare' },
                    { name: 'Ultra Rare', value: 'ultraRare' },
                    { name: 'Legendary', value: 'legendary' },
                    { name: 'Mythic', value: 'mythic' },
                    { name: 'Unobtainable', value: 'unobtainable' }
                )),

    async execute(interaction) {
        // Check if user has admin permissions
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({
                content: 'You need administrator permissions to use this command.',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            const itemData = {
                itemId: interaction.options.getString('itemid'),
                name: interaction.options.getString('name'),
                imageUrl: interaction.options.getString('imageurl'),
                value: interaction.options.getInteger('value'),
                rap: interaction.options.getInteger('rap'),
                rarity: interaction.options.getString('rarity')
            };

            const item = await db.addItem(itemData);
            
            await interaction.editReply({
                content: `Successfully added item:\n**${item.name}**\nValue: R$ ${item.value.toLocaleString()}\nRAP: R$ ${item.rap.toLocaleString()}\nRarity: ${item.rarity}`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error adding item:', error);
            await interaction.editReply({
                content: 'Failed to add item. Please try again later.',
                ephemeral: true
            });
        }
    },
}; 