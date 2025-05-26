const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

class InventoryImageGenerator {
    constructor() {
        // Use a system font that's available in the container
        registerFont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', { family: 'DejaVu Sans' });
        
        this.canvas = createCanvas(800, 600);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 100;
        this.padding = 20;
        
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
    }

    async generateInventoryImage(username, inventory, totalValue) {
        // Load and draw background
        try {
            const background = await loadImage(path.join(__dirname, '../../assets/images/inventory-bg.png'));
            this.ctx.drawImage(background, 0, 0, this.width, this.height);
        } catch (error) {
            // Fallback gradient background if image loading fails
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(1, '#16213e');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // Draw header
        this.drawHeader(username, totalValue);

        // Draw inventory grid
        await this.drawInventoryGrid(inventory);

        return this.canvas.toBuffer();
    }

    drawHeader(username, totalValue) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, 100);

        // Draw username
        this.ctx.font = 'bold 24px DejaVu Sans';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Username: ${username}`, 20, 40);

        // Draw total value
        this.ctx.font = 'bold 24px DejaVu Sans';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Total Value: R$ ${totalValue.toLocaleString()}`, this.width - 20, 40);
    }

    async drawInventoryGrid(inventory) {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                const index = row * this.columns + col;
                const x = this.startX + col * (this.slotSize + this.slotPadding);
                const y = this.startY + row * (this.slotSize + this.slotPadding);

                // Draw slot background
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                this.ctx.fillRect(x, y, this.slotSize, this.slotSize);

                // Draw slot border
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x, y, this.slotSize, this.slotSize);

                if (inventory[index]) {
                    await this.drawItem(inventory[index], x, y);
                }
            }
        }
    }

    async drawItem(item, x, y) {
        try {
            // Load and draw item image
            const itemImage = await loadImage(item.imageUrl);
            const imageSize = this.slotSize - 20;
            const imageX = x + (this.slotSize - imageSize) / 2;
            const imageY = y + 10;
            
            this.ctx.drawImage(itemImage, imageX, imageY, imageSize, imageSize);

            // Draw item name
            this.ctx.font = '14px DejaVu Sans';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(item.name, x + this.slotSize / 2, y + this.slotSize - 5);

            // Draw rarity border if applicable
            if (item.rarity) {
                const rarityColors = {
                    common: '#ffffff',
                    uncommon: '#00ff00',
                    rare: '#0000ff',
                    epic: '#800080',
                    legendary: '#ffd700'
                };

                this.ctx.strokeStyle = rarityColors[item.rarity] || '#ffffff';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(x, y, this.slotSize, this.slotSize);
            }
        } catch (error) {
            console.error('Error drawing item:', error);
            // Draw placeholder if image loading fails
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(x + 10, y + 10, this.slotSize - 20, this.slotSize - 20);
        }
    }
}

module.exports = InventoryImageGenerator; 