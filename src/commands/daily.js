const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../utils/databaseManager');

// Store last claim times in memory (you might want to move this to the database for persistence)
const lastClaims = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily reward'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const userId = interaction.user.id;
            const now = Date.now();
            const lastClaim = lastClaims.get(userId) || 0;
            const cooldown = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

            if (now - lastClaim < cooldown) {
                const timeLeft = cooldown - (now - lastClaim);
                const hoursLeft = Math.ceil(timeLeft / (60 * 60 * 1000));
                
                return interaction.editReply({
                    content: `You can claim your daily reward again in ${hoursLeft} hours.`,
                    ephemeral: true
                });
            }

            // Calculate daily reward based on user's inventory value
            const inventoryValue = await db.calculateInventoryValue(userId);
            const baseReward = 1000; // Base reward of 1,000 R$
            
            // Add 1% of inventory value as bonus (capped at 10,000 R$)
            const inventoryBonus = Math.min(inventoryValue * 0.01, 10000);
            const totalReward = Math.round(baseReward + inventoryBonus);

            // Update user's balance
            const newBalance = await db.updateUserBalance(userId, totalReward);
            lastClaims.set(userId, now);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('Daily Reward Claimed!')
                .setDescription(`You received R$ ${totalReward.toLocaleString()}`)
                .addFields(
                    { name: 'Base Reward', value: `R$ ${baseReward.toLocaleString()}`, inline: true },
                    { name: 'Inventory Bonus', value: `R$ ${inventoryBonus.toLocaleString()}`, inline: true },
                    { name: 'New Balance', value: `R$ ${newBalance.toLocaleString()}`, inline: true }
                )
                .setFooter({ text: 'Come back tomorrow for another reward!' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error processing daily reward:', error);
            await interaction.editReply('Failed to process daily reward. Please try again later.');
        }
    },
}; 