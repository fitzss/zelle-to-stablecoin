# Zelle-to-Stablecoin Processor

A Node.js application that automatically detects incoming Zelle payments (via Plaid) and processes stablecoin payouts based on project IDs.

## Features

- 🏦 Monitors bank accounts for incoming Zelle payments using Plaid
- 🔍 Extracts project IDs from payment memos
- 💰 Processes stablecoin payouts based on project-specific settings
- 🌐 Supports multiple blockchains (Sepolia, Base, Solana, Celo)
- 📊 Provides transaction history and status tracking

## Demo

![Dashboard Screenshot](https://via.placeholder.com/800x400?text=Zelle+to+Stablecoin+Dashboard)

## Prerequisites

- Node.js 14+ and npm

## Installation

1. Clone the repository:
```bash
git clone https://github.com/fitzss/zelle-to-stablecoin.git
cd zelle-to-stablecoin
```

2. Install dependencies:
```bash
npm install
```

3. **No configuration needed!** Demo credentials are already included in the code.

> **Note:** The application comes with hardcoded sandbox credentials for easy testing. No need to create a `.env` file or set up your own API keys.

## Usage

1. Start the server:
```bash
node index.js
```

2. Open your browser and navigate to:
```
http://localhost:3001
```

3. Use the dashboard to:
   - Configure project-specific settings
   - Create test transactions
   - View transaction history
   - See Plaid API activities in real-time

## Online Deployment Options

You can deploy this app online for others to use without having to run it locally:

### Option 1: Render.com (Free & Easy)
1. Create an account at [render.com](https://render.com)
2. Choose "New Web Service"
3. Connect to your GitHub repository
4. Set Build Command: `npm install`
5. Set Start Command: `node index.js`
6. Choose Free plan and click "Create Web Service"

### Option 2: Heroku
1. Create an account at [heroku.com](https://heroku.com)
2. Install Heroku CLI: `npm install -g heroku`
3. Login: `heroku login`
4. Create app: `heroku create`
5. Deploy: `git push heroku main`

### Option 3: Railway.app
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub account
3. Select your repository
4. Deploy with default settings

## How It Works

1. **Bank Connection**: Uses Plaid to connect to bank accounts and monitor transactions
2. **Transaction Detection**: Identifies Zelle payments and extracts project IDs from memos
3. **Stablecoin Processing**: Triggers stablecoin payouts via the Normie Tech API
4. **Status Tracking**: Records and displays transaction statuses and history

## API Endpoints

### Transaction Settings
```
POST /api/transaction-settings
```
Configure per-project payout settings

### Test Transaction
```
POST /test/create-zelle
```
Create a test Zelle transaction

### Transaction Logs
```
GET /api/logs
```
Retrieve transaction history

## Development

The application is currently configured to use Plaid Sandbox and mock stablecoin payouts for development purposes.

To switch to production:
1. Update the Plaid environment in the code
2. Uncomment the actual API call in the `processStablecoinPayout` function
3. Configure real wallet addresses and API keys

## License

MIT

## Acknowledgements

- [Plaid API](https://plaid.com/docs/)
- [Normie Tech API](https://normie.tech)
- [Express.js](https://expressjs.com/) 