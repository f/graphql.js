/**
 * ## Building Queries
 * Builds queries, auto declarations and type finders.
 * @module builder
 */

import { flatten } from './utils'

const AUTODECLARE_PATTERN = /\(@autodeclare\)|\(@autotype\)/
// const FRAGMENT_PATTERN = /\.\.\.\s*([A-Za-z0-9._]+)/g

/**
 * Converts JavaScript primitive types into GraphQL primitive types.
 */
const TYPE_CONVERSION_MAP = {
  string: 'String',
  number: value => (value % 1 === 0 ? 'Int' : 'Float'),
  boolean: 'Boolean'
}

/**
 * @typedef {Object} DetectedType
 * @property {string} key The key of given key definition
 * @property {any} value Given value
 * @property {string} type Detected type of given value
 */

/**
 * Finds the type according to given key and value
 * @param {string} keyDefinition The key or key definition with ! syntax.
 * @param {any} value The value to be detected.
 * @returns {DetectedType} The detected type
 */
export function findType(keyDefinition, value) {
  const [key, forcedType] = keyDefinition.split('!')
  if (forcedType) {
    return { key, value, type: forcedType }
  }
  const jsType = typeof value
  const converter = TYPE_CONVERSION_MAP[jsType]
  if (!converter) {
    throw new Error(`${jsType} is not a detectable type for graphql.js`)
  }

  if (!keyDefinition.match('!') && key.match(/_?id$/i)) {
    return { key, value, type: 'ID' }
  }
  const type = typeof converter === 'function' ? converter(value) : converter
  return { key, value, type }
}

/**
 * Builds the nested fragments object into flatten fragments
 * @param {Object.<string, string>} fragments The object of fragments
 */
export function buildFragments(fragments = {}) {
  const flattenFragments = flatten(fragments)
  const fragmentObject = {}
  for (let name in flattenFragments) {
    let fragment = flattenFragments[name]
    if (!fragment.toString().match(/^on\s(\w+)/)) {
      throw new Error('Fragments must start with `on {TypeName}`')
    }
    fragmentObject[name] = `fragment ${name} ${fragment}`
  }
  return fragmentObject
}

/**
 * Converts `(@autodeclare)` string into GraphQL type definition
 * string using given variables.
 *
 * @param {string} query
 * @param {Object} variables
 *
 * @returns {string} The auto declared query.
 */
export function autoDeclare(query, variables = {}) {
  const keys = Object.keys(variables)
  if (!keys.length) {
    return query.replace(AUTODECLARE_PATTERN, '')
  }
  const types = keys
    .map(key => findType(key, variables[key]))
    .map(({ key, type }) => `$${key}: ${type}!`)
    .join(', ')
  return query.replace(AUTODECLARE_PATTERN, types ? `(${types})` : '')
}

export function cleanKeys(variables = {}) {
  const cleanVariables = {}
  for (let key in variables) {
    let value = variables[key]
    let [cleanKey] = key.split('!')
    cleanVariables[cleanKey] = value
  }
  return cleanVariables
}
