import test from 'tape'
import { get } from 'tiny-json-http'
import http from 'http'
import { start, end } from '@architect/sandbox'
import { currentRoot } from '../../src/shared/redirect-map.mjs'

const host = 'http://localhost:3333'
const root = `${host}${currentRoot}`

function getStatusAndLocation (url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => resolve({ status: res.statusCode, location: res.headers.location }))
      .on('error', reject)
  })
}

test('check key paths', async (t) => {
  await start({ quiet: true })
  t.pass(`sandbox started at ${host}`)

  const quickstart = await get({ url: root })
  t.ok(quickstart.body, 'got quickstart document')

  const playground = await get({ url: `${host}/playground` })
  t.ok(playground.body, 'got static playground document')

  const catRedirect = await getStatusAndLocation(`${host}/docs/en/get-started`)
  t.equal(catRedirect.status, 302, 'category path returns redirect')
  t.equal(catRedirect.location, '/docs/en/get-started/why-architect', 'redirects to first doc in category')

  await end()
  t.pass('sandbox ended')

  t.end()
})
