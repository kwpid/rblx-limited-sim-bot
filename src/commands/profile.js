const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../utils/databaseManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View your profile and stats'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const userId = interaction.user.id;
            const user = await db.getUser(userId);
            const inventory = await db.getUserInventory(userId);
            const totalValue = await db.calculateInventoryValue(userId);
            const totalRap = await db.calculateInventoryRap(userId);

            // Count items by rarity
            const rarityCounts = {
                common: 0,
                uncommon: 0,
                rare: 0,
                ultraRare: 0,
                legendary: 0,
                mythic: 0,
                unobtainable: 0
            };

            inventory.forEach(item => {
                rarityCounts[item.rarity]++;
            });

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`${interaction.user.username}'s Profile`)
                .setThumbnail(interaction.user.displayAvatarURL())
                .addFields(
                    { name: 'Balance', value: `R$ ${user.balance.toLocaleString()}`, inline: true },
                    { name: 'Total Value', value: `R$ ${totalValue.toLocaleString()}`, inline: true },
                    { name: 'Total RAP', value: `R$ ${totalRap.toLocaleString()}`, inline: true },
                    { name: 'Inventory Size', value: `${inventory.length} items`, inline: true },
                    { name: '\u200B', value: '\u200B' }, // Empty line
                    { name: 'Items by Rarity', value: 
                        `Common: ${rarityCounts.common}\n` +
                        `Uncommon: ${rarityCounts.uncommon}\n` +
                        `Rare: ${rarityCounts.rare}\n` +
                        `Ultra Rare: ${rarityCounts.ultraRare}\n` +
                        `Legendary: ${rarityCounts.legendary}\n` +
                        `Mythic: ${rarityCounts.mythic}\n` +
                        `Unobtainable: ${rarityCounts.unobtainable}`
                    }
                )
                .setFooter({ text: 'Use /daily to claim your daily reward!' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching profile:', error);
            await interaction.editReply('Failed to fetch profile. Please try again later.');
        }
    },
}; 