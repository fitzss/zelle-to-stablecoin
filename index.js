/**
 * Zelle-to-Stablecoin Payment Processor
 * 
 * This application monitors bank accounts for Zelle payments using Plaid's API,
 * matches payment memos to project IDs, and processes stablecoin payouts.
 * 
 * @author Your Name
 * @version 1.0.0
 */

const express = require('express');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios'); // Add axios for Normie Tech API calls
require('dotenv').config();

// Demo credentials for easy testing - these are hardcoded sample values
const DEMO_PLAID_CLIENT_ID = '67deff5f90625d0022c97aa2';  // Example demo ID
const DEMO_PLAID_SECRET = '886f7cb2fe22d354a6316a35a445a9'; // Example demo secret
const DEMO_NORMIE_PROJECT_ID = 'pillur';
const DEMO_NORMIE_API_KEY = 'qyX6rOMQUUnZf74ee6KWyfeZ4zWa/V6/3UoSkGaXjVI=';

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Normie Tech Configuration - use demo values if .env values not found
const NORMIE_API_URL = 'https://api-sandbox.normie.tech';
const NORMIE_PROJECT_ID = process.env.NORMIE_PROJECT_ID || DEMO_NORMIE_PROJECT_ID;
const NORMIE_API_KEY = process.env.NORMIE_API_KEY || DEMO_NORMIE_API_KEY;

// Payout Configuration
const PAYOUT_CONFIG = {
  settlementType: 'Payout',
  payoutPeriod: 'Instant',
  blockchain: process.env.DEFAULT_BLOCKCHAIN || 'Sepolia',
  currency: 'USDC',
  walletAddress: process.env.DEFAULT_WALLET_ADDRESS || '0x50b8430Cbf6B470A63a5aa1e331A93a68CFD5BE9'
};

// Initialize Plaid client with demo credentials if .env values not found
const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || DEMO_PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET || DEMO_PLAID_SECRET,
      'Plaid-Version': '2020-09-14'
    },
  },
});

const client = new PlaidApi(config);

// Store access token and transactions (in production, use a database)
let storedAccessToken = null;
let cursor = null;
let transactionLog = [];
let projectSettings = {}; // Add a place to store project settings

// Add activity log tracking
const activityLogs = [];

function logActivity(message, type = 'info') {
  const logEntry = {
    timestamp: new Date(),
    message,
    type
  };
  activityLogs.unshift(logEntry); // Add to beginning of array
  
  // Limit log entries to 100
  if (activityLogs.length > 100) {
    activityLogs.pop();
  }
  
  console.log(`[${type.toUpperCase()}] ${message}`);
  return logEntry;
}

// Add stablecoin payout function
const processStablecoinPayout = async (amount, projectId) => {
  try {
    // Log payout attempt
    logActivity(`Initiating stablecoin payout for amount: ${amount} USDC, Project ID: ${projectId}`, 'normie');
    
    // Get project specific settings or use defaults
    const settings = projectSettings[projectId] || PAYOUT_CONFIG;
    logActivity(`Using settings for project ${projectId}: ${settings.blockchain} -> ${settings.walletAddress}`, 'normie');
    
    // Log API details for debugging (but mask sensitive info)
    logActivity('Preparing Normie Tech API request', 'normie');
    
    // Create the request payload
    const payload = {
      project_id: NORMIE_PROJECT_ID,
      amount: amount,
      currency: settings.currency || PAYOUT_CONFIG.currency,
      blockchain: settings.blockchain || PAYOUT_CONFIG.blockchain,
      wallet_address: settings.walletAddress || PAYOUT_CONFIG.walletAddress,
      metadata: {
        project_id: projectId,
        source: 'zelle_payment'
      }
    };
    
    logActivity(`Request payload created for ${payload.currency} payout on ${payload.blockchain}`, 'normie');
    
    // Temporarily comment out the actual API call and return a mock success for testing
    /*
    const response = await axios.post(`${NORMIE_API_URL}/v1/transactions`, payload, {
      headers: {
        'Authorization': `Bearer ${NORMIE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Log successful payout
    logActivity('Payout successful via Normie Tech API', 'normie');

    return {
      status: 'success',
      blockchain: settings.blockchain,
      currency: settings.currency || PAYOUT_CONFIG.currency,
      transaction_hash: response.data.transaction_hash,
      timestamp: new Date().toISOString()
    };
    */
    
    // Return a mock success response for testing
    logActivity('Returning mock success response (production would call Normie Tech API)', 'normie');
    return {
      status: 'success',
      blockchain: settings.blockchain,
      currency: settings.currency || PAYOUT_CONFIG.currency,
      transaction_hash: 'mock_tx_hash_' + Date.now(),
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logActivity(`Payout failed: ${error.message}`, 'error');
    
    return {
      status: 'failed',
      blockchain: PAYOUT_CONFIG.blockchain,
      currency: PAYOUT_CONFIG.currency,
      timestamp: new Date().toISOString(),
      error: error.response?.data?.message || error.message || 'Unknown error occurred'
    };
  }
};

// Modify the existing logTransaction function to include stablecoin payout
const logTransaction = async (transaction, projectId) => {
  const logEntry = {
    timestamp: new Date(),
    transaction: {
      ...transaction,
      projectId
    },
    status: 'processing'
  };
  
  // Process stablecoin payout
  const payoutResult = await processStablecoinPayout(transaction.amount, projectId);
  logEntry.payout = payoutResult;
  logEntry.status = payoutResult.status === 'success' ? 'completed' : 'failed';
  
  transactionLog.push(logEntry);
  console.log('Transaction processed:', JSON.stringify(logEntry, null, 2));
  
  return logEntry;
};

// Create a sandbox public token
const createSandboxToken = async () => {
  try {
    logActivity('Creating Plaid Sandbox public token for First Platypus Bank', 'plaid');
    const response = await client.sandboxPublicTokenCreate({
      institution_id: 'ins_109508', // First Platypus Bank
      initial_products: ['transactions'],
      options: {
        webhook: 'https://yourdomain.com/api/plaid/webhook',
      },
    });
    logActivity('Plaid Sandbox public token created successfully', 'plaid');
    return response.data.public_token;
  } catch (error) {
    logActivity(`Error creating Plaid Sandbox token: ${error.message}`, 'error');
    throw error;
  }
};

// Exchange public token for access token
const exchangeToken = async (public_token) => {
  try {
    logActivity('Exchanging Plaid public token for access token', 'plaid');
    const response = await client.itemPublicTokenExchange({ public_token });
    storedAccessToken = response.data.access_token;
    logActivity('Access token received and stored from Plaid', 'plaid');
    return storedAccessToken;
  } catch (error) {
    logActivity(`Error exchanging Plaid token: ${error.message}`, 'error');
    throw error;
  }
};

// Sync transactions
const syncTransactions = async () => {
  try {
    logActivity('Syncing transactions from Plaid', 'plaid');
    const request = { access_token: storedAccessToken };
    if (cursor) request.cursor = cursor;

    const response = await client.transactionsSync(request);
    const { added, next_cursor } = response.data;

    cursor = next_cursor;
    logActivity(`Received ${added.length} new transactions from Plaid`, 'plaid');

    for (const tx of added) {
      if (tx.name.includes('Zelle')) {
        const memo = tx.payment_meta?.reference_number || tx.name;
        const matchedID = extractProjectID(memo);
        
        logActivity(`Detected Zelle payment: $${tx.amount} with memo "${memo}"`, 'plaid');
        
        // Enhanced logging
        const logEntry = await logTransaction(tx, matchedID);
        
        logActivity(`Matched to Project ID: ${matchedID || 'Not matched'}`, 'plaid');
      }
    }
  } catch (error) {
    logActivity(`Error syncing transactions: ${error.message}`, 'error');
    throw error;
  }
};

// Extract project ID from memo
const extractProjectID = (memo) => {
  // Example: If memo format is "PROJ-123", extract "123"
  const match = memo.match(/PROJ-(\d+)/);
  return match ? match[1] : null;
};

// Update the webhook handler
app.post('/webhook', async (req, res) => {
  try {
    const { webhook_type, webhook_code, item_id, initial_update_complete, new_transactions } = req.body;
    
    if (webhook_type === 'TRANSACTIONS' && webhook_code === 'INITIAL_UPDATE') {
      console.log('Initial transaction sync complete');
      return res.json({ received: true });
    }

    if (webhook_type === 'TRANSACTIONS' && webhook_code === 'DEFAULT_UPDATE') {
      console.log('New transactions available');
      await syncTransactions();
      return res.json({ received: true });
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add endpoint to update payout settings
app.post('/api/payout-settings', (req, res) => {
  try {
    const { settlementType, payoutPeriod, blockchain, walletAddress } = req.body;
    
    if (!walletAddress || !blockchain) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Both walletAddress and blockchain are required'
      });
    }

    // Validate wallet address format based on blockchain
    if (blockchain === 'Sepolia' && !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        error: 'Invalid wallet address format',
        details: 'Sepolia wallet address must be a valid Ethereum address starting with 0x'
      });
    }

    PAYOUT_CONFIG.settlementType = settlementType || PAYOUT_CONFIG.settlementType;
    PAYOUT_CONFIG.payoutPeriod = payoutPeriod || PAYOUT_CONFIG.payoutPeriod;
    PAYOUT_CONFIG.blockchain = blockchain;
    PAYOUT_CONFIG.walletAddress = walletAddress;
    
    res.json({ success: true, config: PAYOUT_CONFIG });
  } catch (error) {
    console.error('Error updating payout settings:', error);
    res.status(500).json({ 
      error: 'Error saving settings',
      details: error.message
    });
  }
});

// Create a test Zelle transaction
app.post('/test/create-zelle', async (req, res) => {
  try {
    const { amount, projectId } = req.body;
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      logActivity(`Invalid amount provided in test: ${amount}`, 'error');
      return res.status(400).json({
        error: 'Invalid amount',
        details: 'Amount must be a positive number'
      });
    }

    if (!projectId || !projectId.match(/^PROJ-\d+$/)) {
      logActivity(`Invalid project ID format in test: ${projectId}`, 'error');
      return res.status(400).json({
        error: 'Invalid project ID',
        details: 'Project ID must be in format PROJ-123'
      });
    }

    const now = new Date();
    const testTransaction = {
      account_id: 'default',
      amount: parseFloat(amount),
      date: now.toISOString().split('T')[0],
      name: `Zelle payment from John ${projectId}`,
      payment_meta: {
        reference_number: projectId
      }
    };

    logActivity(`Creating test Zelle transaction via Plaid Sandbox: $${amount} for ${projectId}`, 'plaid');
    
    // Simulate the process of Plaid detecting a transaction
    logActivity('Triggering Plaid webhook to simulate transaction detection', 'plaid');
    
    // Trigger transaction sync
    await client.sandboxItemFireWebhook({
      access_token: storedAccessToken,
      webhook_type: 'TRANSACTIONS',
      webhook_code: 'SYNC_UPDATES_AVAILABLE'
    });

    // Log the transaction
    const logEntry = await logTransaction(testTransaction, projectId);
    
    logActivity(`Test Zelle transaction successfully processed through Plaid Sandbox`, 'plaid');
    res.json({ success: true, transaction: testTransaction, log: logEntry });
  } catch (error) {
    logActivity(`Error creating test transaction: ${error.message}`, 'error');
    res.status(500).json({ 
      error: 'Error creating transaction',
      details: error.message
    });
  }
});

// Get transaction logs
app.get('/api/logs', (req, res) => {
  res.json(transactionLog);
});

// Add endpoint to get payout settings
app.get('/api/payout-settings', (req, res) => {
  res.json(PAYOUT_CONFIG);
});

// Add endpoint to update transaction settings
app.post('/api/transaction-settings', (req, res) => {
  try {
    console.log('Received transaction settings request:', req.body);
    
    const { projectId, settlementType, payoutPeriod, blockchain, walletAddress } = req.body;
    
    // Validate required fields
    if (!projectId) {
      console.error('Missing projectId in request');
      return res.status(400).json({ 
        error: 'Missing required field',
        details: 'projectId is required'
      });
    }

    if (!walletAddress || !blockchain) {
      console.error('Missing walletAddress or blockchain in request');
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Both walletAddress and blockchain are required'
      });
    }

    // Validate wallet address format based on blockchain
    if (blockchain === 'Sepolia' && !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      console.error(`Invalid wallet address format: ${walletAddress}`);
      return res.status(400).json({
        error: 'Invalid wallet address format',
        details: 'Sepolia wallet address must be a valid Ethereum address starting with 0x'
      });
    }

    // Store settings for this project
    const settings = {
      projectId,
      settlementType: settlementType || PAYOUT_CONFIG.settlementType,
      payoutPeriod: payoutPeriod || PAYOUT_CONFIG.payoutPeriod,
      blockchain,
      walletAddress,
      currency: PAYOUT_CONFIG.currency, // Keep the same currency
      updatedAt: new Date().toISOString()
    };

    // Store project settings
    projectSettings[projectId] = settings;

    // In a production environment, you would save this to a database
    console.log('Transaction settings updated:', settings);
    console.log('All project settings:', projectSettings);
    
    res.json({ 
      success: true, 
      message: 'Transaction settings saved successfully',
      settings: settings 
    });
  } catch (error) {
    console.error('Error saving transaction settings:', error);
    res.status(500).json({ 
      error: 'Error saving settings',
      details: error.message || 'Unknown error occurred'
    });
  }
});

// Add endpoint to get Plaid connection status
app.get('/api/plaid-status', (req, res) => {
  try {
    const isConnected = !!storedAccessToken;
    res.json({
      connected: isConnected,
      institution: 'First Platypus Bank',
      message: isConnected ? 'Successfully connected to Plaid Sandbox' : 'Not connected to Plaid',
      lastSyncTime: isConnected ? new Date().toISOString() : null
    });
  } catch (error) {
    console.error('Error checking Plaid status:', error);
    res.status(500).json({ 
      connected: false,
      error: 'Error checking Plaid status',
      details: error.message
    });
  }
});

// Add endpoint to get activity logs
app.get('/api/activity-logs', (req, res) => {
  try {
    res.json(activityLogs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ 
      error: 'Error fetching activity logs',
      details: error.message
    });
  }
});

// Initialize the connection
const initialize = async () => {
  try {
    logActivity('Initializing Plaid Sandbox connection', 'plaid');
    const public_token = await createSandboxToken();
    await exchangeToken(public_token);
    logActivity('Successfully connected to Plaid Sandbox', 'plaid');
    
    // Fire a test webhook with the required webhook_type
    logActivity('Firing initial test webhook to simulate transactions update', 'plaid');
    await client.sandboxItemFireWebhook({
      access_token: storedAccessToken,
      webhook_code: 'DEFAULT_UPDATE',
      webhook_type: 'TRANSACTIONS'
    });
    logActivity('Test webhook fired successfully', 'plaid');
  } catch (error) {
    logActivity(`Initialization error: ${error.message}`, 'error');
  }
};

// Start the server
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Dashboard available at:`);
  console.log(`- http://localhost:${PORT}`);
  console.log(`- http://127.0.0.1:${PORT}`);
  initialize();
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try a different port or close the application using that port.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
}); 