# Roblox Limiteds Discord Bot

A Discord bot featuring an economy system based on Roblox limiteds, including case openings and inventory management.

## Features

- Dynamic inventory visualization
- Case opening system
- Economy management
- Roblox limiteds trading
- Guild-specific functionality

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
DISCORD_TOKEN=your_discord_bot_token
GUILD_ID=your_guild_id
```

3. Create the following directory structure:
```
assets/
  ├── fonts/
  │   ├── Roboto-Bold.ttf
  │   └── Roboto-Regular.ttf
  └── images/
      └── inventory-bg.png
```

4. Download the Roboto fonts and place them in the `assets/fonts` directory.

5. Add a background image for the inventory screen in `assets/images/inventory-bg.png`.

6. Start the bot:
```bash
npm start
```

## Railway Deployment

1. Create a new Railway project
2. Connect your GitHub repository
3. Add the following environment variables in Railway:
   - `DISCORD_TOKEN` - Your Discord bot token
   - `GUILD_ID` - Your Discord server ID
   - `DATABASE_URL` - Railway will automatically provide this when you create a PostgreSQL database
4. Deploy the project

## Commands

- `/inventory` - View your Roblox limiteds inventory
- `/open` - Open a case
- More commands coming soon...

## Contributing

Feel free to submit issues and enhancement requests! 