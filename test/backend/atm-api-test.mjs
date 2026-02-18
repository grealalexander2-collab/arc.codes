import test from 'tape'
import { get } from 'tiny-json-http'
import { start, end } from '@architect/sandbox'

const host = 'http://localhost:3333'

test('ATM API endpoint', async (t) => {
  await start({ quiet: true })
  t.pass('sandbox started')

  // Test successful withdrawal
  const withdrawal = await get({ url: `${host}/api/atm?amount=50` })
  const result = typeof withdrawal.body === 'string' ? JSON.parse(withdrawal.body) : withdrawal.body
  t.ok(result.success, 'withdrawal was successful')
  t.equal(result.transaction.amount, 50, 'correct withdrawal amount')
  t.equal(result.transaction.newBalance, 950, 'correct new balance')

  // Test insufficient funds
  try {
    await get({ url: `${host}/api/atm?amount=2000` })
    t.fail('should have thrown an error for insufficient funds')
  } catch (err) {
    const errorResult = typeof err.body === 'string' ? JSON.parse(err.body) : err.body
    t.ok(!errorResult.success, 'insufficient funds error returned')
    t.equal(errorResult.error, 'Insufficient funds', 'correct error message')
  }

  // Test invalid amount
  try {
    await get({ url: `${host}/api/atm?amount=0` })
    t.fail('should have thrown an error for zero amount')
  } catch (err) {
    const errorResult = typeof err.body === 'string' ? JSON.parse(err.body) : err.body
    t.ok(!errorResult.success, 'invalid amount error returned')
  }

  await end()
  t.pass('sandbox ended')

  t.end()
})
