/**
 * ## Requesting to GraphQL Server
 * This is the utility file to help **graphql.js**.
 * All the functions which are not related to graphql should
 * be here.
 * @module request
 */

import { isBrowser } from './utils'

/**
 * Puts a detailed log string to the `console`.
 * @param {Object} options The `options` parameter for debugging
 * @param {string} options.method The method, GET or POST
 * @param {string} options.url The URL to send the request
 * @param {Object} options.data The data object to send to the GraphQL server
 * @param {string} options.data.query The GraphQL Query
 * @param {Object.<string,*>} options.data.variables The variables for the GraphQL query
 * @param {Boolean} options.asJSON If the request is JSON or form-data
 * @returns {void}
 */
export function debugRequest({ method, url, data, asJSON }) {
  if (!console) return
  console.groupCollapsed(
    `[graphql]     ${method.toUpperCase()} ${url}:
  query     : ${data.query.split(/\n/)[0].substr(0, 50)}...
  variables : ${JSON.stringify(data.variables).substr(0, 50)}...`
  )
  console.log('QUERY: %c%s', 'font-weight: bold', data.query)
  console.log(
    'VARIABLES: %c%s\n\nsending as ' + (asJSON ? 'json' : 'form url-data'),
    'font-weight: bold',
    JSON.stringify(data.variables, null, 2),
    data.variables
  )
  console.groupEnd()
}

/**
 * Tries to parse JSON, fallbacks to string itself.
 * @param {string} text The JSON text to be parsed.
 * @returns {(Object|string)}
 */
export function tryToParseJSON(text) {
  try {
    return JSON.parse(text)
  } catch (e) {
    return text
  }
}

/**
 * Generates header part of request for GraphQL server. Adds `Accept` and `Content-Type`
 * @param {Object<string,string>} headers The headers object to be built
 * @param {Boolean} asJSON Defines `Content-Type` according to this value
 */
export function generateRequestHeaders(headers, asJSON = true) {
  return {
    'Content-Type': asJSON ? 'application/json' : 'application/x-www-form-urlencoded',
    Accept: 'application/json',
    ...headers
  }
}

/**
 * Generates body part of request for GraphQL server.
 * @param {string} query The GraphQL query
 * @param {Object<string,*>} variables The variables for the GraphQL query
 * @param {Boolean} asJSON Defines `Content-Type` according to this value
 */
export function generateRequestBody(query, variables = {}, asJSON = true) {
  if (asJSON) {
    return JSON.stringify({ query, variables })
  }
  return `query=${encodeURIComponent(query)}&variables=${encodeURIComponent(JSON.stringify(variables))}`
}

export function browserRequest({ method, url, headers, asJSON, body, success, error, data, debugMode }) {
  const requestHeaders = generateRequestHeaders(headers, asJSON)
  const xhr = new XMLHttpRequest()
  xhr.open(method, url, true)
  for (let key in requestHeaders) {
    xhr.setRequestHeader(key, requestHeaders[key])
  }
  xhr.onload = () => success(tryToParseJSON(xhr.responseText), xhr.status)
  if (typeof error === 'function') {
    xhr.onerror = () => error(xhr.responseText, xhr.status)
  }
  xhr.send(body)
  if (debugMode) debugRequest({ method, url, data, asJSON })
}

export function nodeRequest({ method, url, headers, asJSON, body, success, error }) {
  const requestHeaders = generateRequestHeaders(headers, asJSON)
  const http = require('http')
  const https = require('https')
  const URL = require('url')
  const uri = URL(url)
  const requestor = uri.protocol === 'https:' ? https : http
  const request = requestor.request(
    {
      ...uri,
      method: method,
      headers: requestHeaders
    },
    response => {
      let responseText = ''
      response.setEncoding('utf8')
      response.on('data', data => (responseText += data))
      response.on('end', () => success(tryToParseJSON(responseText), response.statusCode))
    }
  )
  if (typeof error === 'function') {
    request.on('error', e => error(e))
  }
  request.write(body)
  request.end()
}

export default function request(opts) {
  const options = {
    method: 'POST',
    url: '',
    headers: {},
    data: {
      query: '',
      variables: {}
    },
    error: () => {},
    success: () => {},
    debugMode: false,
    asJSON: true,
    ...opts
  }

  const { query, variables } = options.data
  const body = generateRequestBody(query, variables, options.asJSON)

  return (isBrowser() ? browserRequest : nodeRequest)({ ...options, body })
}
