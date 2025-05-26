const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

class InventoryImageGenerator {
    constructor() {
        // Initialize canvas dimensions
        this.width = 800;
        this.height = 600;
        
        // Grid configuration
        this.rows = 3;
        this.columns = 4;
        this.slotSize = 150;
        this.slotPadding = 20;
        
        // Calculate starting position for grid
        this.startX = (this.width - (this.columns * (this.slotSize + this.slotPadding))) / 2;
        this.startY = 150; // Leave space for header
        
        // Register fonts
        registerFont(path.join(__dirname, '../../assets/fonts/Roboto-Bold.ttf'), { family: 'Roboto', weight: 'bold' });
        registerFont(path.join(__dirname, '../../assets/fonts/Roboto-Regular.ttf'), { family: 'Roboto' });
    }

    async generateInventoryImage(username, inventory, totalValue) {
        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext('2d');

        // Load and draw background
        try {
            const background = await loadImage(path.join(__dirname, '../../assets/images/inventory-bg.png'));
            ctx.drawImage(background, 0, 0, this.width, this.height);
        } catch (error) {
            // Fallback gradient background if image loading fails
            const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(1, '#16213e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.width, this.height);
        }

        // Draw header
        this.drawHeader(ctx, username, totalValue);

        // Draw inventory grid
        await this.drawInventoryGrid(ctx, inventory);

        return canvas.toBuffer();
    }

    drawHeader(ctx, username, totalValue) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.width, 100);

        // Draw username
        ctx.font = 'bold 24px Roboto';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`Username: ${username}`, 20, 40);

        // Draw total value
        ctx.font = 'bold 24px Roboto';
        ctx.textAlign = 'right';
        ctx.fillText(`Total Value: R$ ${totalValue.toLocaleString()}`, this.width - 20, 40);
    }

    async drawInventoryGrid(ctx, inventory) {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                const index = row * this.columns + col;
                const x = this.startX + col * (this.slotSize + this.slotPadding);
                const y = this.startY + row * (this.slotSize + this.slotPadding);

                // Draw slot background
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fillRect(x, y, this.slotSize, this.slotSize);

                // Draw slot border
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, this.slotSize, this.slotSize);

                if (inventory[index]) {
                    await this.drawItem(ctx, inventory[index], x, y);
                }
            }
        }
    }

    async drawItem(ctx, item, x, y) {
        try {
            // Load and draw item image
            const itemImage = await loadImage(item.imageUrl);
            const imageSize = this.slotSize - 20;
            const imageX = x + (this.slotSize - imageSize) / 2;
            const imageY = y + 10;
            
            ctx.drawImage(itemImage, imageX, imageY, imageSize, imageSize);

            // Draw item name
            ctx.font = '14px Roboto';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(item.name, x + this.slotSize / 2, y + this.slotSize - 5);

            // Draw rarity border if applicable
            if (item.rarity) {
                const rarityColors = {
                    common: '#ffffff',
                    uncommon: '#00ff00',
                    rare: '#0000ff',
                    epic: '#800080',
                    legendary: '#ffd700'
                };

                ctx.strokeStyle = rarityColors[item.rarity] || '#ffffff';
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, this.slotSize, this.slotSize);
            }
        } catch (error) {
            console.error('Error drawing item:', error);
            // Draw placeholder if image loading fails
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(x + 10, y + 10, this.slotSize - 20, this.slotSize - 20);
        }
    }
}

module.exports = InventoryImageGenerator; 