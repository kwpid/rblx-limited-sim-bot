const { User, Item, Case, UserInventory, CaseItems } = require('../models');

class DatabaseManager {
    async initialize() {
        // Database initialization is handled in models/index.js
    }

    async getUser(userId) {
        const [user] = await User.findOrCreate({
            where: { userId },
            defaults: { balance: 0 }
        });
        return user;
    }

    async addItemToUser(userId, itemId) {
        const user = await this.getUser(userId);
        await user.addItem(itemId);
    }

    async removeItemFromUser(userId, itemId) {
        const user = await this.getUser(userId);
        await user.removeItem(itemId);
    }

    async getItemDetails(itemId) {
        const item = await Item.findByPk(itemId);
        return item?.toJSON();
    }

    async getCaseDetails(caseId) {
        const caseInstance = await Case.findByPk(caseId, {
            include: [{
                model: Item,
                through: CaseItems
            }]
        });
        
        if (!caseInstance) return null;
        
        const caseData = caseInstance.toJSON();
        return {
            ...caseData,
            possibleItems: caseData.Items.map(item => item.itemId)
        };
    }

    async updateUserBalance(userId, amount) {
        const user = await this.getUser(userId);
        user.balance += amount;
        await user.save();
        return user.balance;
    }

    async getUserInventory(userId) {
        const user = await User.findByPk(userId, {
            include: [{
                model: Item,
                through: UserInventory
            }]
        });

        if (!user) return [];

        return user.Items.map(item => item.toJSON());
    }

    async calculateInventoryValue(userId) {
        const inventory = await this.getUserInventory(userId);
        return inventory.reduce((total, item) => total + item.value, 0);
    }

    async calculateInventoryRap(userId) {
        const inventory = await this.getUserInventory(userId);
        return inventory.reduce((total, item) => total + item.rap, 0);
    }

    // New methods for dynamic item/case management
    async addItem(itemData) {
        const [item] = await Item.findOrCreate({
            where: { itemId: itemData.itemId },
            defaults: itemData
        });
        return item;
    }

    async updateItem(itemId, itemData) {
        const item = await Item.findByPk(itemId);
        if (item) {
            await item.update(itemData);
        }
        return item;
    }

    async addCase(caseData) {
        const { items, ...caseInfo } = caseData;
        const [caseInstance] = await Case.findOrCreate({
            where: { caseId: caseInfo.caseId },
            defaults: caseInfo
        });

        if (items) {
            await caseInstance.setItems(items);
        }

        return caseInstance;
    }

    async updateCase(caseId, caseData) {
        const { items, ...caseInfo } = caseData;
        const caseInstance = await Case.findByPk(caseId);
        
        if (caseInstance) {
            await caseInstance.update(caseInfo);
            if (items) {
                await caseInstance.setItems(items);
            }
        }
        
        return caseInstance;
    }

    async getAllItems() {
        return await Item.findAll();
    }

    async getAllCases() {
        return await Case.findAll({
            include: [{
                model: Item,
                through: CaseItems
            }]
        });
    }
}

module.exports = new DatabaseManager(); 