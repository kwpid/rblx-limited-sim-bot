const { User, Item, Case, UserInventory, CaseItem } = require('../models');
const fs = require('fs');
const path = require('path');

class DatabaseManager {
    constructor() {
        this.items = new Map();
        this.cases = new Map();
        this.loadItems();
    }

    loadItems() {
        try {
            const itemsPath = path.join(__dirname, '../data/items.json');
            const data = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
            
            // Load items
            data.items.forEach(item => {
                this.items.set(item.itemId, item);
            });

            // Load cases
            Object.entries(data.cases).forEach(([caseId, caseData]) => {
                this.cases.set(caseId, caseData);
            });

            console.log(`Loaded ${this.items.size} items and ${this.cases.size} cases from items.json`);
        } catch (error) {
            console.error('Error loading items from items.json:', error);
        }
    }

    calculateItemValue(item) {
        // For legendary and unobtainable items, value increases with fewer owners
        if (item.rarity === 'legendary' || item.rarity === 'unobtainable') {
            const ownerCount = item.owners.length;
            const rarityMultiplier = item.rarity === 'legendary' ? 1.5 : 2;
            
            // Base multiplier starts at 2x for legendary and 3x for unobtainable
            let multiplier = rarityMultiplier;
            
            // Reduce multiplier based on number of owners (much more subtle now)
            if (ownerCount > 0) {
                // Only reduce by 0.01 per owner (1% reduction)
                multiplier = Math.max(1, rarityMultiplier - (ownerCount * 0.01));
            }
            
            return Math.round(item.baseValue * multiplier);
        }
        
        // For other rarities, value remains constant
        return item.baseValue;
    }

    async getUser(userId) {
        const [user] = await User.findOrCreate({
            where: { userId },
            defaults: { balance: 1000 }
        });
        return user;
    }

    async addItemToUser(userId, itemId) {
        const user = await this.getUser(userId);
        const item = this.items.get(itemId);
        
        if (!item) {
            throw new Error('Item not found');
        }

        // Add user to item owners if not already an owner
        if (!item.owners.includes(userId)) {
            item.owners.push(userId);
            item.value = this.calculateItemValue(item);
            this.saveItems();
        }

        await UserInventory.create({
            UserUserId: user.userId,
            ItemItemId: itemId
        });

        return item;
    }

    async removeItemFromUser(userId, itemId) {
        const user = await this.getUser(userId);
        const item = this.items.get(itemId);
        
        if (!item) {
            throw new Error('Item not found');
        }

        // Remove user from item owners
        const ownerIndex = item.owners.indexOf(userId);
        if (ownerIndex > -1) {
            item.owners.splice(ownerIndex, 1);
            item.value = this.calculateItemValue(item);
            this.saveItems();
        }

        const deleted = await UserInventory.destroy({
            where: {
                UserUserId: user.userId,
                ItemItemId: itemId
            }
        });

        if (!deleted) {
            throw new Error('Item not found in user inventory');
        }
    }

    saveItems() {
        try {
            const itemsPath = path.join(__dirname, '../data/items.json');
            const data = {
                items: Array.from(this.items.values()),
                cases: Object.fromEntries(this.cases)
            };
            fs.writeFileSync(itemsPath, JSON.stringify(data, null, 4));
        } catch (error) {
            console.error('Error saving items:', error);
        }
    }

    getItemDetails(itemId) {
        const item = this.items.get(itemId);
        if (!item) return null;
        
        return {
            ...item,
            value: this.calculateItemValue(item)
        };
    }

    getCaseDetails(caseId) {
        return this.cases.get(caseId);
    }

    async updateUserBalance(userId, amount) {
        const user = await this.getUser(userId);
        user.balance += amount;
        await user.save();
        return user.balance;
    }

    async getUserInventory(userId) {
        const user = await this.getUser(userId);
        const inventory = await UserInventory.findAll({
            where: { UserUserId: user.userId },
            include: [{
                model: Item,
                attributes: ['itemId', 'name', 'imageUrl', 'value', 'rap', 'rarity']
            }]
        });

        return inventory.map(entry => {
            const item = this.items.get(entry.Item.itemId);
            return {
                ...entry.Item.toJSON(),
                value: this.calculateItemValue(item)
            };
        });
    }

    async calculateInventoryValue(userId) {
        const inventory = await this.getUserInventory(userId);
        return inventory.reduce((total, item) => total + item.value, 0);
    }

    async calculateInventoryRap(userId) {
        const inventory = await this.getUserInventory(userId);
        return inventory.reduce((total, item) => total + item.rap, 0);
    }

    // Admin methods for managing items and cases
    async addItem(itemData) {
        const itemsPath = path.join(__dirname, '../data/items.json');
        const data = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
        
        // Add ownership tracking fields
        const newItem = {
            ...itemData,
            owners: [],
            baseValue: itemData.value
        };
        
        data.items.push(newItem);
        this.items.set(newItem.itemId, newItem);
        
        fs.writeFileSync(itemsPath, JSON.stringify(data, null, 4));
        return newItem;
    }

    async updateItem(itemId, itemData) {
        const itemsPath = path.join(__dirname, '../data/items.json');
        const data = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
        
        const index = data.items.findIndex(item => item.itemId === itemId);
        if (index === -1) {
            throw new Error('Item not found');
        }

        // Preserve ownership data
        const currentItem = data.items[index];
        const updatedItem = {
            ...currentItem,
            ...itemData,
            owners: currentItem.owners || [],
            baseValue: itemData.value || currentItem.baseValue
        };

        data.items[index] = updatedItem;
        this.items.set(itemId, updatedItem);
        
        fs.writeFileSync(itemsPath, JSON.stringify(data, null, 4));
        return updatedItem;
    }

    async addCase(caseData) {
        const itemsPath = path.join(__dirname, '../data/items.json');
        const data = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
        
        data.cases[caseData.caseId] = caseData;
        this.cases.set(caseData.caseId, caseData);
        
        fs.writeFileSync(itemsPath, JSON.stringify(data, null, 4));
        return caseData;
    }

    async updateCase(caseId, caseData) {
        const itemsPath = path.join(__dirname, '../data/items.json');
        const data = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
        
        if (!data.cases[caseId]) {
            throw new Error('Case not found');
        }

        data.cases[caseId] = { ...data.cases[caseId], ...caseData };
        this.cases.set(caseId, data.cases[caseId]);
        
        fs.writeFileSync(itemsPath, JSON.stringify(data, null, 4));
        return data.cases[caseId];
    }

    getAllItems() {
        return Array.from(this.items.values()).map(item => ({
            ...item,
            value: this.calculateItemValue(item)
        }));
    }

    getAllCases() {
        return Array.from(this.cases.values());
    }
}

module.exports = new DatabaseManager(); 