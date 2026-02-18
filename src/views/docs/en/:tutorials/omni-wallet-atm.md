---
title: 'Building an Omni-Wallet ATM API'
category: Tutorials
description: Learn how to build a multi-channel wallet API for ATM operations with Architect
sections:
  - "Overview"
  - "Setting up the API"
  - "Database schema"
  - "Implementing wallet operations"
  - "ATM withdrawal functionality"
  - "Security considerations"
---

# Building an Omni-Wallet ATM API

This tutorial demonstrates how to build a multi-channel (omni-channel) wallet API that supports ATM operations using Architect. You'll learn how to create secure endpoints for checking balances, making withdrawals, and managing user accounts.

## Overview

An omni-wallet system allows users to access their funds through multiple channels (web, mobile, ATM). In this tutorial, we'll focus on creating the backend API that could power ATM operations.

### What you'll build

- RESTful API endpoints for wallet operations
- DynamoDB tables for storing wallet data
- Secure authentication for ATM transactions
- Transaction history and audit logging

## Setting up the API

First, create a new Architect project or add to an existing one. Update your `app.arc` file:

```arc
@app
omni-wallet-api

@http
get /wallet/:userId
post /wallet/:userId/withdraw
get /wallet/:userId/transactions

@tables
wallets
  userId *String

transactions
  transactionId *String
  userId **String
```

## Database schema

Our wallet system uses two DynamoDB tables:

### Wallets table
- `userId` (partition key): Unique identifier for the user
- `balance`: Current balance in cents
- `currency`: Currency code (e.g., 'USD')
- `status`: Account status ('active', 'frozen', 'closed')

### Transactions table
- `transactionId` (partition key): Unique transaction ID
- `userId` (sort key): For querying user's transactions
- `type`: Transaction type ('withdrawal', 'deposit', 'transfer')
- `amount`: Transaction amount in cents
- `timestamp`: When the transaction occurred
- `location`: ATM location or channel

## Implementing wallet operations

Create a handler for checking wallet balance:

```javascript
// src/http/get-wallet-000userId/index.mjs
import arc from '@architect/functions'

export async function handler(req) {
  const { userId } = req.pathParameters
  
  const data = await arc.tables()
  const wallet = await data.wallets.get({ userId })
  
  if (!wallet) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Wallet not found' })
    }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      userId: wallet.userId,
      balance: wallet.balance,
      currency: wallet.currency
    })
  }
}
```

## ATM withdrawal functionality

Implement the withdrawal endpoint with proper validation:

```javascript
// src/http/post-wallet-000userId-withdraw/index.mjs
import arc from '@architect/functions'
import { randomUUID } from 'crypto'

export async function handler(req) {
  const { userId } = req.pathParameters
  const { amount, atmId } = JSON.parse(req.body)
  
  // Validate amount
  if (!amount || amount <= 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid amount' })
    }
  }
  
  const data = await arc.tables()
  const wallet = await data.wallets.get({ userId })
  
  if (!wallet) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Wallet not found' })
    }
  }
  
  // Check sufficient balance
  if (wallet.balance < amount) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Insufficient funds' })
    }
  }
  
  // Update wallet balance
  const newBalance = wallet.balance - amount
  await data.wallets.update({
    Key: { userId },
    UpdateExpression: 'SET balance = :newBalance',
    ExpressionAttributeValues: {
      ':newBalance': newBalance
    }
  })
  
  // Record transaction
  const transactionId = randomUUID()
  await data.transactions.put({
    transactionId,
    userId,
    type: 'withdrawal',
    amount,
    location: `ATM-${atmId}`,
    timestamp: new Date().toISOString()
  })
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      transactionId,
      newBalance,
      amount
    })
  }
}
```

## Security considerations

When building ATM integration:

1. **Authentication**: Implement strong authentication (PIN + card number)
2. **Encryption**: Use HTTPS for all API calls
3. **Rate limiting**: Prevent brute force attacks
4. **Transaction limits**: Set daily withdrawal limits
5. **Audit logging**: Log all transactions for compliance
6. **Fraud detection**: Monitor for suspicious patterns

### Example security middleware

```javascript
// src/shared/auth.mjs
export async function validateATMRequest(req) {
  const { pin, cardNumber } = req.headers
  
  // Validate PIN and card number
  // In production, use proper encryption and validation
  if (!pin || !cardNumber) {
    throw new Error('Missing authentication credentials')
  }
  
  // Additional security checks...
  return true
}
```

## Next steps

- Add support for deposits and transfers
- Implement real-time notifications
- Add support for multiple currencies
- Build a mobile app interface
- Integrate with actual ATM hardware

## Related resources

- [HTTP Functions](/docs/en/guides/frontend/http-functions)
- [Database Functions](/docs/en/guides/backend/database-functions)
- [Events & Queues](/docs/en/guides/backend/events-and-queues)
