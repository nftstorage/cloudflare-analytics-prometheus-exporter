#!/usr/bin/env node

import dotenv from 'dotenv'
import { startExporter } from './index.js'

dotenv.config()

startExporter({
  cfApiToken: mustGetEnv('CF_API_TOKEN'),
  cfAuthEmail: mustGetEnv('CF_AUTH_EMAIL'),
  cfZoneId: mustGetEnv('CF_ZONE_ID'),
  promNamespace: mustGetEnv('PROM_NAMESPACE'),
  port: process.env.PORT
})

/**
 * @param {string} name
 */
function mustGetEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`missing ${name} environment variable`)
  return value
}
