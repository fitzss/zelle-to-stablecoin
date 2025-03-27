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
- Plaid developer account
- Normie Tech API access (for production use)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/zelle-to-stablecoin.git
cd zelle-to-stablecoin
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Create a `.env` file in the root directory with your credentials:
```
# Plaid credentials
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
PLAID_ENV=sandbox

# Normie Tech credentials
NORMIE_PROJECT_ID=your_project_id
NORMIE_API_KEY=your_api_key

# Default wallet settings
DEFAULT_BLOCKCHAIN=Sepolia
DEFAULT_WALLET_ADDRESS=0x...
```

> **Note:** For quick testing, demo credentials are hardcoded in the application. You don't need to set up your own API keys to try it out.

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
1. Update the Plaid environment in the `.env` file
2. Uncomment the actual API call in the `processStablecoinPayout` function
3. Configure real wallet addresses and API keys

## License

MIT

## Acknowledgements

- [Plaid API](https://plaid.com/docs/)
- [Normie Tech API](https://normie.tech)
- [Express.js](https://expressjs.com/) 