const axios = require('axios');

class RolimonsAPI {
    constructor() {
        this.baseUrl = 'https://www.rolimons.com/api/v1';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async getItemDetails(itemId) {
        try {
            // Check cache first
            const cached = this.cache.get(itemId);
            if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }

            // Fetch from Rolimons API
            const response = await axios.get(`${this.baseUrl}/items/${itemId}`);
            const data = response.data;

            // Transform data to our format
            const itemData = {
                itemId: itemId.toString(),
                name: data.name,
                imageUrl: `https://tr.rbxcdn.com/${data.assetId}/150/150/Image/Png`,
                value: data.value || 0,
                rap: data.rap || 0,
                rarity: this.determineRarity(data.value)
            };

            // Cache the result
            this.cache.set(itemId, {
                data: itemData,
                timestamp: Date.now()
            });

            return itemData;
        } catch (error) {
            console.error(`Error fetching item ${itemId} from Rolimons:`, error);
            return null;
        }
    }

    determineRarity(value) {
        if (value >= 1000000) return 'legendary';
        if (value >= 100000) return 'epic';
        if (value >= 10000) return 'rare';
        if (value >= 1000) return 'uncommon';
        return 'common';
    }

    async searchItems(query) {
        try {
            const response = await axios.get(`${this.baseUrl}/search`, {
                params: { q: query }
            });
            return response.data.items.map(item => ({
                itemId: item.id.toString(),
                name: item.name,
                imageUrl: `https://tr.rbxcdn.com/${item.assetId}/150/150/Image/Png`,
                value: item.value || 0,
                rap: item.rap || 0,
                rarity: this.determineRarity(item.value)
            }));
        } catch (error) {
            console.error('Error searching items on Rolimons:', error);
            return [];
        }
    }

    async getTrendingItems() {
        try {
            const response = await axios.get(`${this.baseUrl}/trending`);
            return response.data.items.map(item => ({
                itemId: item.id.toString(),
                name: item.name,
                imageUrl: `https://tr.rbxcdn.com/${item.assetId}/150/150/Image/Png`,
                value: item.value || 0,
                rap: item.rap || 0,
                rarity: this.determineRarity(item.value)
            }));
        } catch (error) {
            console.error('Error fetching trending items from Rolimons:', error);
            return [];
        }
    }
}

module.exports = new RolimonsAPI(); 