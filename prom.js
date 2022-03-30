
import * as Prom from 'prom-client'

/**
 * @typedef {{
 *   requestsTotal: Prom.Counter
 *   cachedRequestsTotal: Prom.Counter
 *   firewallBlocked: Prom.Counter
 *   requestsByContentTypeTotal: Prom.Counter<'type'>
 * }} Metrics
 */

export function createRegistry (ns = 'cfanalytics') {
  return {
    registry: Prom.register,
    metrics: {
      requestsTotal: new Prom.Counter({
        name: `${ns}_requests_total`,
        help: 'Number of requests.'
      }),
      cachedRequestsTotal: new Prom.Counter({
        name: `${ns}_cached_requests_total`,
        help: 'Number of cached requests.'
      }),
      firewallBlocked: new Prom.Counter({
        name: `${ns}_firewall_blocked_requests_total`,
        help: 'Number of firewall blocked requests.'
      }),
      requestsByContentTypeTotal: new Prom.Counter({
        name: `${ns}_requests_content_type_total`,
        help: 'Number of requests per content type delivered.',
        labelNames: ['type']
      })
    }
  }
}
/**
 * @param {Metrics} metrics
 */
export function recordMetrics(metrics) {
  /**
   * @param {AsyncIterable<import('./analytics').Analytics>} source
   */
  return async function* (source) {
    for await (const analytics of source) {
      const { requests, cachedRequests, firewallBlockedRequests, contentTypeRequests } = analytics

      // Increment requests
      metrics.requestsTotal.inc(requests)

      // Increment cached requests
      metrics.cachedRequestsTotal.inc(cachedRequests)

      // Increment firewall blocked requests
      metrics.firewallBlocked.inc(firewallBlockedRequests)

      // Increment request counts for each content type
      Object.keys(contentTypeRequests).forEach(type => {
        metrics.requestsByContentTypeTotal.inc({ type }, contentTypeRequests[type])
      })

      yield analytics
    }
  }
}
