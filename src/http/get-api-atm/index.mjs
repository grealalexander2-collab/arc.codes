/**
 * ATM API endpoint for local money withdrawal simulation
 * Demonstrates basic ATM functionality using AWS Lambda
 */

export async function handler (req) {
  let statusCode = 200
  let body

  try {
    const queryParams = req.queryStringParameters || {}
    const amount = parseFloat(queryParams.amount) || 0
    const accountBalance = 1000 // Simulated account balance

    // Validate withdrawal amount
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be greater than zero')
    }

    if (amount > accountBalance) {
      throw new Error('Insufficient funds')
    }

    // Simulate withdrawal
    const newBalance = accountBalance - amount

    body = JSON.stringify({
      success: true,
      message: 'Money withdrawn successfully from local ATM',
      transaction: {
        amount: amount,
        previousBalance: accountBalance,
        newBalance: newBalance,
        timestamp: new Date().toISOString(),
      },
    })
  }
  catch (e) {
    statusCode = 400
    body = JSON.stringify({
      success: false,
      error: e.message,
    })
  }

  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf8',
    },
    body,
  }
}
