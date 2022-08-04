import http from 'http'
import debug from 'debug'
import { pipe } from 'it-pipe'
import { GraphQLClient } from 'graphql-request'

import { getAnalytics } from './analytics.js'
import { createRegistry, recordMetrics } from './prom.js'

const log = debug('exporter:index')
const ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql'

/**
 * @param {Object} config
 * @param {string} config.cfApiToken Cloudflare API Token with permissions for zone
 * @param {string} config.cfAuthEmail Cloudflare API account email.
 * @param {string} config.cfZoneId Cloudflare Zone identifier.
 * @param {string} config.promNamespace Prometheus metrics namespace.
 * @param {number} [config.port] Port to run the metrics server on.
 */
export async function startExporter({
  cfApiToken,
  cfAuthEmail,
  cfZoneId,
  promNamespace,
  port = 3000
}) {
  log('Creating graphQL client...')
  const client = new GraphQLClient(ENDPOINT, { headers: {
    'X-AUTH-EMAIL': cfAuthEmail,
    'Authorization': `Bearer ${cfApiToken}`
  }})

  log('creating Prometheus metrics registry...')
  const { metrics, registry } = createRegistry(promNamespace)

  log('creating HTTP server...')
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`)
    if (url.pathname === '/metrics') {
      res.write(await registry.metrics())
    } else {
      res.statusCode = 404
      res.write('not found')
    }
    res.end()
  })
  server.listen(port, () => log(`server listening on: http://localhost:${port}`))

  try {
    await pipe(
      getAnalytics(client, cfZoneId),
      recordMetrics(metrics),
      logResult
    )
  } finally {
    log('closing HTTP server...')
    server.close()
  }
}

/**
 * @param {AsyncIterable<import('./analytics').Analytics>} source
 */
async function logResult(source) {
  for await (const res of source) {
    log(`incremented ${res.requests} requests`)
    log(`incremented ${res.cachedRequests} cached requests`)
    log(`incremented ${res.firewallBlockedRequests} firewall blocked requests`)
    res.contentTypeRequests && Object.keys(res.contentTypeRequests).forEach(key => {
      log(`incremented content type ${key} with ${res.contentTypeRequests[key]} requests`)
    })
  }
}
