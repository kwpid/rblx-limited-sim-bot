const { SlashCommandBuilder } = require('discord.js');
const limitedsImporter = require('../utils/limitedsImporter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('importlimiteds')
        .setDescription('Import all Rolimons limiteds and create rarity-based cases')
        .addBooleanOption(option =>
            option.setName('create_cases')
                .setDescription('Whether to create cases for each rarity')
                .setRequired(false)),

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
            const createCases = interaction.options.getBoolean('create_cases') ?? true;
            
            await interaction.editReply('Starting limiteds import... This may take a while.');
            
            if (createCases) {
                await limitedsImporter.createRarityBasedCases();
                await interaction.editReply('Successfully imported all limiteds and created rarity-based cases!');
            } else {
                const categorizedItems = await limitedsImporter.importAllLimiteds();
                
                // Create a summary message
                const summary = Object.entries(categorizedItems)
                    .map(([rarity, items]) => `${rarity}: ${items.length} items`)
                    .join('\n');
                
                await interaction.editReply(`Successfully imported all limiteds!\n\n**Import Summary:**\n${summary}`);
            }
        } catch (error) {
            console.error('Error importing limiteds:', error);
            await interaction.editReply('Failed to import limiteds. Please try again later.');
        }
    },
}; 