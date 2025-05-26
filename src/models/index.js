const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize with Railway's DATABASE_URL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

// Define User model
const User = sequelize.define('User', {
    userId: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    balance: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});

// Define Item model
const Item = sequelize.define('Item', {
    itemId: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: false
    },
    value: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    rap: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    rarity: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// Define Case model
const Case = sequelize.define('Case', {
    caseId: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

// Define UserInventory model (junction table for many-to-many relationship)
const UserInventory = sequelize.define('UserInventory', {
    userId: {
        type: DataTypes.STRING,
        references: {
            model: User,
            key: 'userId'
        }
    },
    itemId: {
        type: DataTypes.STRING,
        references: {
            model: Item,
            key: 'itemId'
        }
    }
});

// Define CaseItems model (junction table for many-to-many relationship)
const CaseItems = sequelize.define('CaseItems', {
    caseId: {
        type: DataTypes.STRING,
        references: {
            model: Case,
            key: 'caseId'
        }
    },
    itemId: {
        type: DataTypes.STRING,
        references: {
            model: Item,
            key: 'itemId'
        }
    }
});

// Set up relationships
User.belongsToMany(Item, { through: UserInventory });
Item.belongsToMany(User, { through: UserInventory });

Case.belongsToMany(Item, { through: CaseItems });
Item.belongsToMany(Case, { through: CaseItems });

// Initialize database
async function initializeDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        
        // Sync all models
        await sequelize.sync();
        console.log('Database models synchronized.');
        
        // Initialize default items and cases if they don't exist
        await initializeDefaultData();
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
}

// Function to initialize default items and cases
async function initializeDefaultData() {
    const defaultItems = [
        {
            itemId: 'dominus_empyreus',
            name: 'Dominus Empyreus',
            imageUrl: 'https://tr.rbxcdn.com/1e6e0c0b0b0b0b0b0b0b0b0b0b0b0b0b/150/150/Image/Png',
            value: 1000000,
            rap: 950000,
            rarity: 'legendary'
        },
        {
            itemId: 'sparkle_time_fedora',
            name: 'Sparkle Time Fedora',
            imageUrl: 'https://tr.rbxcdn.com/2e6e0c0b0b0b0b0b0b0b0b0b0b0b0b0b/150/150/Image/Png',
            value: 50000,
            rap: 45000,
            rarity: 'rare'
        }
    ];

    const defaultCases = [
        {
            caseId: 'basic_case',
            name: 'Basic Case',
            imageUrl: 'https://tr.rbxcdn.com/basic_case_image.png',
            price: 1000,
            items: ['sparkle_time_fedora']
        },
        {
            caseId: 'premium_case',
            name: 'Premium Case',
            imageUrl: 'https://tr.rbxcdn.com/premium_case_image.png',
            price: 5000,
            items: ['dominus_empyreus', 'sparkle_time_fedora']
        }
    ];

    // Create items
    for (const item of defaultItems) {
        await Item.findOrCreate({
            where: { itemId: item.itemId },
            defaults: item
        });
    }

    // Create cases and their relationships
    for (const caseData of defaultCases) {
        const { items, ...caseInfo } = caseData;
        const [caseInstance] = await Case.findOrCreate({
            where: { caseId: caseInfo.caseId },
            defaults: caseInfo
        });

        // Add items to case
        for (const itemId of items) {
            await caseInstance.addItem(itemId);
        }
    }
}

module.exports = {
    sequelize,
    User,
    Item,
    Case,
    UserInventory,
    CaseItems,
    initializeDatabase
}; 