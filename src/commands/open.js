const { SlashCommandBuilder } = require('discord.js');
const db = require('../utils/databaseManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('open')
        .setDescription('Open a case')
        .addStringOption(option =>
            option.setName('case')
                .setDescription('The case to open')
                .setRequired(true)
                .addChoices(
                    { name: 'Basic Case', value: 'basic_case' },
                    { name: 'Premium Case', value: 'premium_case' }
                )),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const userId = interaction.user.id;
            const caseId = interaction.options.getString('case');
            const user = await db.getUser(userId);
            const caseDetails = await db.getCaseDetails(caseId);

            // Check if user has enough balance
            if (user.balance < caseDetails.price) {
                return interaction.editReply(`You don't have enough balance to open this case. You need R$ ${caseDetails.price.toLocaleString()}`);
            }

            // Deduct case price
            await db.updateUserBalance(userId, -caseDetails.price);

            // Select random item from case
            const possibleItems = caseDetails.possibleItems;
            const randomItemId = possibleItems[Math.floor(Math.random() * possibleItems.length)];
            const itemDetails = await db.getItemDetails(randomItemId);

            // Add item to user's inventory
            await db.addItemToUser(userId, randomItemId);

            // Create response embed
            const response = {
                content: `You opened a ${caseDetails.name} and got:\n**${itemDetails.name}**\nValue: R$ ${itemDetails.value.toLocaleString()}\nRAP: R$ ${itemDetails.rap.toLocaleString()}`,
                files: [{
                    attachment: itemDetails.imageUrl,
                    name: 'item.png'
                }]
            };

            await interaction.editReply(response);
        } catch (error) {
            console.error('Error opening case:', error);
            await interaction.editReply('Failed to open case. Please try again later.');
        }
    },
}; 