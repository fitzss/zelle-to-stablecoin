const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
require('dotenv').config();

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
      'Plaid-Version': '2020-09-14'
    },
  },
});

const client = new PlaidApi(config);

// Function to create a test Zelle transaction
async function createTestZelleTransaction() {
  try {
    // First create a sandbox public token
    const createResponse = await client.sandboxPublicTokenCreate({
      institution_id: 'ins_109508',
      initial_products: ['transactions'],
    });

    // Exchange it for an access token
    const exchangeResponse = await client.itemPublicTokenExchange({
      public_token: createResponse.data.public_token,
    });

    const accessToken = exchangeResponse.data.access_token;

    // Create a test transaction
    await client.sandboxItemFireWebhook({
      access_token: accessToken,
      webhook_type: 'TRANSACTIONS',
      webhook_code: 'SYNC_UPDATES_AVAILABLE'
    });

    console.log('Test Zelle transaction created successfully!');
    console.log('Access Token:', accessToken);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
createTestZelleTransaction(); 