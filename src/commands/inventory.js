const { SlashCommandBuilder } = require('discord.js');
const InventoryImageGenerator = require('../utils/inventoryImageGenerator');
const db = require('../utils/databaseManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('View your Roblox limiteds inventory'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const userId = interaction.user.id;
            const inventory = await db.getUserInventory(userId);
            const totalValue = await db.calculateInventoryValue(userId);
            const totalRap = await db.calculateInventoryRap(userId);

            const imageGenerator = new InventoryImageGenerator();
            const imageBuffer = await imageGenerator.generateInventoryImage(
                interaction.user.username,
                inventory,
                totalValue
            );

            await interaction.editReply({
                content: `Total Value: R$ ${totalValue.toLocaleString()}\nTotal RAP: R$ ${totalRap.toLocaleString()}`,
                files: [{
                    attachment: imageBuffer,
                    name: 'inventory.png'
                }]
            });
        } catch (error) {
            console.error('Error generating inventory image:', error);
            await interaction.editReply('Failed to generate inventory image. Please try again later.');
        }
    },
}; 