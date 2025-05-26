const axios = require('axios');
const db = require('./databaseManager');

class LimitedsImporter {
    constructor() {
        this.baseUrl = 'https://www.rolimons.com/api/v2';
        this.rarityThresholds = {
            common: { min: 0, max: 25000 },
            uncommon: { min: 25001, max: 74999 },
            rare: { min: 75000, max: 145000 },
            ultraRare: { min: 145001, max: 350000 },
            legendary: { min: 350001, max: 950000 },
            mythic: { min: 950001, max: 7500000 },
            unobtainable: { min: 7500001, max: Infinity }
        };
    }

    determineRarity(rap) {
        for (const [rarity, { min, max }] of Object.entries(this.rarityThresholds)) {
            if (rap >= min && rap <= max) {
                return rarity;
            }
        }
        return 'common'; // Fallback
    }

    async fetchAllLimiteds() {
        try {
            const response = await axios.get(`${this.baseUrl}/items/limiteds`);
            if (!response.data || !response.data.items) {
                throw new Error('Invalid response format from Rolimons API');
            }
            return response.data.items;
        } catch (error) {
            console.error('Error fetching limiteds from Rolimons:', error);
            return [];
        }
    }

    async importAllLimiteds() {
        console.log('Starting limiteds import...');
        const limiteds = await this.fetchAllLimiteds();
        console.log(`Found ${limiteds.length} limiteds`);

        const categorizedItems = {
            common: [],
            uncommon: [],
            rare: [],
            ultraRare: [],
            legendary: [],
            mythic: [],
            unobtainable: []
        };

        for (const item of limiteds) {
            const rarity = this.determineRarity(item.rap);
            const itemData = {
                itemId: item.id.toString(),
                name: item.name,
                imageUrl: `https://tr.rbxcdn.com/${item.assetId}/150/150/Image/Png`,
                value: item.value || 0,
                rap: item.rap || 0,
                rarity: rarity
            };

            categorizedItems[rarity].push(itemData);
            await db.addItem(itemData);
        }

        // Log statistics
        console.log('\nImport Statistics:');
        for (const [rarity, items] of Object.entries(categorizedItems)) {
            console.log(`${rarity}: ${items.length} items`);
        }

        return categorizedItems;
    }

    async createRarityBasedCases() {
        const categorizedItems = await this.importAllLimiteds();
        
        // Create cases for each rarity
        for (const [rarity, items] of Object.entries(categorizedItems)) {
            if (items.length === 0) continue;

            const caseData = {
                caseId: `${rarity}_case`,
                name: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} Case`,
                imageUrl: `https://tr.rbxcdn.com/case_${rarity}.png`, // You'll need to provide actual case images
                price: this.calculateCasePrice(rarity),
                items: items.map(item => item.itemId)
            };

            await db.addCase(caseData);
            console.log(`Created ${caseData.name}`);
        }
    }

    calculateCasePrice(rarity) {
        const basePrices = {
            common: 1000,
            uncommon: 2500,
            rare: 5000,
            ultraRare: 10000,
            legendary: 25000,
            mythic: 50000,
            unobtainable: 100000
        };
        return basePrices[rarity] || 1000;
    }
}

module.exports = new LimitedsImporter(); 