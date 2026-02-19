---
title: Building an ATM Withdrawal System with Omni Wallet
category: Tutorials
description: Create a serverless ATM withdrawal application integrated with Omni Wallet using Architect
sections:
  - "Overview"
  - "Prerequisites"
  - "Project Setup"
  - "Database Schema"
  - "API Endpoints"
  - "Wallet Integration"
  - "Transaction Processing"
  - "Security Considerations"
  - "Deployment"
---

## Overview

This tutorial demonstrates how to build a serverless ATM withdrawal system integrated with Omni Wallet using the Architect framework. The application will handle cryptocurrency withdrawals through ATM interfaces, managing user authentication, balance verification, and transaction processing.

Omni Wallet is a web-based cryptocurrency wallet that supports Bitcoin and Omni Protocol tokens. By integrating it with an ATM withdrawal system, users can convert their digital assets to physical cash through ATM machines.

## Prerequisites

Before starting, ensure you have:

- Node.js 16+ installed
- An AWS account with credentials configured
- Basic understanding of Architect framework
- Familiarity with cryptocurrency wallets and APIs
- Knowledge of RESTful API design

## Project Setup

Initialize a new Architect project for the ATM withdrawal system:

```bash
npm init @architect ./atm-omni-wallet
cd atm-omni-wallet
```

Update your `app.arc` manifest to define the application structure:

```arc
@app
atm-omni-wallet

@http
get /
get /api/balance
post /api/withdraw
post /api/verify
get /api/transactions

@tables
users
  userId *String

transactions
  transactionId *String
  timestamp **Number

wallets
  walletAddress *String
  userId **String

@aws
region us-east-1
runtime nodejs18.x
```

## Database Schema

The application uses DynamoDB tables to store user data, transactions, and wallet information:

### Users Table
- `userId` (Partition Key): Unique user identifier
- `email`: User email address
- `createdAt`: Account creation timestamp
- `status`: Account status (active, suspended, etc.)

### Transactions Table
- `transactionId` (Partition Key): Unique transaction identifier
- `timestamp` (Sort Key): Transaction timestamp
- `userId`: User who initiated the transaction
- `amount`: Withdrawal amount
- `walletAddress`: Omni wallet address
- `atmId`: ATM machine identifier
- `status`: Transaction status (pending, completed, failed)

### Wallets Table
- `walletAddress` (Partition Key): Omni wallet address
- `userId` (Sort Key): Associated user ID
- `balance`: Cached wallet balance
- `lastSync`: Last balance synchronization timestamp

## API Endpoints

### GET /api/balance

Retrieve the current balance from the user's Omni Wallet:

```javascript
// src/http/get-api-balance/index.mjs
import { getBalance } from '@architect/shared/omni-wallet.mjs'

export async function handler(event) {
  const { userId, walletAddress } = event.queryStringParameters || {}
  
  if (!walletAddress) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'walletAddress is required' })
    }
  }
  
  try {
    const balance = await getBalance(walletAddress)
    
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        walletAddress,
        balance,
        currency: 'BTC'
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
```

### POST /api/withdraw

Process an ATM withdrawal request:

```javascript
// src/http/post-api-withdraw/index.mjs
import { tables } from '@architect/functions'
import { processWithdrawal } from '@architect/shared/withdrawal.mjs'

export async function handler(event) {
  const { userId, amount, atmId, walletAddress } = JSON.parse(event.body)
  
  try {
    // Validate withdrawal request
    if (amount <= 0 || amount > 10000) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid withdrawal amount' })
      }
    }
    
    // Process the withdrawal
    const transaction = await processWithdrawal({
      userId,
      amount,
      atmId,
      walletAddress
    })
    
    // Store transaction record
    const db = await tables()
    await db.transactions.put({
      transactionId: transaction.id,
      timestamp: Date.now(),
      userId,
      amount,
      walletAddress,
      atmId,
      status: 'pending'
    })
    
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        success: true,
        transactionId: transaction.id,
        message: 'Withdrawal initiated'
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
```

## Wallet Integration

Create a shared module to interact with the Omni Wallet API:

```javascript
// src/shared/omni-wallet.mjs
import https from 'https'

const OMNI_API_URL = 'https://api.omniwallet.org'

export async function getBalance(walletAddress) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.omniwallet.org',
      path: `/v1/address/addr/${walletAddress}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }
    
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const response = JSON.parse(data)
          resolve(response.balance)
        } catch (error) {
          reject(error)
        }
      })
    })
    
    req.on('error', reject)
    req.end()
  })
}

export async function sendTransaction(walletAddress, amount, destination) {
  // Implementation for sending Omni transactions
  // This would interact with the Omni Protocol API
  // to create and broadcast transactions
  return {
    txid: 'sample-transaction-id',
    status: 'pending'
  }
}
```

## Transaction Processing

Implement the withdrawal processing logic:

```javascript
// src/shared/withdrawal.mjs
import { getBalance, sendTransaction } from './omni-wallet.mjs'
import crypto from 'crypto'

export async function processWithdrawal({ userId, amount, atmId, walletAddress }) {
  // Generate unique transaction ID
  const transactionId = crypto.randomUUID()
  
  // Verify wallet balance
  const balance = await getBalance(walletAddress)
  
  if (balance < amount) {
    throw new Error('Insufficient balance')
  }
  
  // In a real implementation, this would:
  // 1. Lock the funds in the wallet
  // 2. Communicate with the ATM system to dispense cash
  // 3. Complete the blockchain transaction
  // 4. Update all relevant records
  
  // Simplified transaction creation
  const transaction = {
    id: transactionId,
    userId,
    amount,
    atmId,
    walletAddress,
    timestamp: Date.now(),
    status: 'initiated'
  }
  
  return transaction
}

export async function verifyTransaction(transactionId) {
  // Verify transaction status with Omni blockchain
  // Check if transaction has required confirmations
  return {
    confirmed: true,
    confirmations: 6
  }
}
```

## Security Considerations

When building an ATM withdrawal system with cryptocurrency integration, security is paramount:

### 1. Authentication & Authorization
- Implement multi-factor authentication (MFA) for all withdrawal requests
- Use time-based one-time passwords (TOTP) for additional security
- Require biometric verification when available at ATM

### 2. Transaction Limits
- Set daily withdrawal limits per user
- Implement velocity checks to detect unusual activity
- Add cooling-off periods for large withdrawals

### 3. Private Key Management
- Never store private keys on the server
- Use secure enclaves or hardware security modules (HSMs)
- Implement client-side signing when possible

### 4. API Security
```javascript
// Example: Rate limiting middleware
export async function rateLimitMiddleware(event) {
  const userId = event.requestContext.authorizer?.userId
  const key = `rate-limit:${userId}`
  
  // Check rate limit (implementation depends on your cache strategy)
  const requests = await checkRateLimit(key)
  
  if (requests > 10) {
    return {
      statusCode: 429,
      body: JSON.stringify({ error: 'Too many requests' })
    }
  }
}
```

### 5. Encryption
- Encrypt sensitive data at rest in DynamoDB
- Use TLS/SSL for all API communications
- Implement end-to-end encryption for wallet addresses

## Deployment

Deploy your ATM withdrawal system to AWS:

```bash
# Install dependencies
npm install

# Run local sandbox for testing
npx arc sandbox

# Deploy to staging
npx arc deploy --staging

# Deploy to production
npx arc deploy --production
```

### Environment Variables

Configure environment variables for different environments:

```bash
# Set API keys securely
npx arc env set OMNI_API_KEY your-api-key --production
npx arc env set ATM_PROVIDER_KEY your-atm-key --production
```

### Monitoring

Set up CloudWatch alarms for critical metrics:

```arc
@app
atm-omni-wallet

@events
transaction-alerts

@queues
failed-transactions
```

Monitor:
- Failed withdrawal attempts
- Unusual transaction patterns
- API error rates
- Response times

## Next Steps

To enhance your ATM withdrawal system:

1. **Add WebSocket Support**: Implement real-time transaction updates using `@ws` in your manifest
2. **Implement Queue Processing**: Use `@queues` for handling failed transactions and retries
3. **Add Scheduled Functions**: Create `@scheduled` functions for balance synchronization
4. **Enhanced Logging**: Integrate comprehensive logging with CloudWatch
5. **Compliance Features**: Add KYC/AML verification workflows
6. **Multi-Currency Support**: Extend to support multiple cryptocurrencies

## Resources

- [Architect Documentation](https://arc.codes)
- [Omni Protocol API Documentation](https://api.omniwallet.org/)
- [Omni Layer GitHub](https://github.com/OmniLayer/omniwallet)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Design Patterns](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

## Conclusion

You now have a foundation for building a secure, serverless ATM withdrawal system integrated with Omni Wallet using Architect. This architecture leverages AWS Lambda for compute, DynamoDB for data persistence, and API Gateway for HTTP endpoints, providing a scalable and cost-effective solution for cryptocurrency ATM services.

Remember to thoroughly test your implementation, especially the security aspects, before deploying to production. Consider conducting security audits and penetration testing for any system handling financial transactions.
