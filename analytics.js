import debug from 'debug'
import delay from 'delay'
import { gql } from 'graphql-request'

const log = debug('exporter:analytics')

/**
 * @typedef {Object} Analytics
 * @property {number} firewallBlockedRequests
 * @property {number} requests
 * @property {number} cachedRequests
 * @property {Record<string, number>} contentTypeRequests
 */

const query = gql`
    query getAnalytics ($zoneTag: String!, $dateLt: Time!, $dateGeq: Time!){
      viewer {
        zones(filter: { zoneTag: $zoneTag}) {
          httpRequests1mGroups(limit: 5, filter: { datetime_geq: $dateGeq, datetime_lt: $dateLt }) {
            sum {
              requests,
              cachedRequests,
              contentTypeMap {
                edgeResponseContentTypeName,
                requests
              }
            }
          }
          firewallEventsAdaptiveGroups (limit: 100, filter: { datetime_geq: $dateGeq, datetime_lt: $dateLt, action:"block" }) {
            count
          }
        }
      }
    }
  `

/**
 * @param {import('graphql-request').GraphQLClient} client
 * @param {string} zoneId
 */
export function getAnalytics (client, zoneId) {
  return async function * () {
    let endTs = Date.now()
    let startTs = endTs - (5 * MINUTE)
    while (true) {
      // Get Last 5 minutes metrics
      const dateLt = new Date(endTs).toISOString()
      const dateGeq = new Date(startTs).toISOString()

      const { viewer } = await client.request(query, {
        zoneTag: zoneId,
        dateLt,
        dateGeq
      })

      log(`metrics ready for interval ${dateGeq} -> ${dateLt}`)
      yield /** @type {Analytics} */ ({
        firewallBlockedRequests: viewer.zones[0].firewallEventsAdaptiveGroups[0]?.count || 0,
        requests: viewer.zones[0].httpRequests1mGroups[0]?.sum?.requests || 0,
        cachedRequests: viewer.zones[0].httpRequests1mGroups[0]?.sum?.cachedRequests || 0,
        contentTypeRequests: viewer.zones[0].httpRequests1mGroups[0]?.sum?.contentTypeMap?.
          reduce((obj, item) => Object.assign(obj, { [item.edgeResponseContentTypeName]: item.requests }), {})
      })

      // Wait for 5 minutes
      await delay(5 * MINUTE)
      startTs = endTs
      endTs = Date.now()
    }
  }
}

// Milliseconds in a minute
const MINUTE = 60 * 1000
