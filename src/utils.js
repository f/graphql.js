/**
 * ## Handy Assets
 * This is the utility file to help **graphql.js**.
 * All the functions which are not related to graphql should
 * be here.
 * @module utils
 */

/**
 * Makes an array unique at its first level.
 * @param {Array} array Array to make unique
 * @returns {Array} The array with unique items
 * @example
 * import { uniq } from './utils'
 *
 * uniq([1, 2, 3, 3, 4]) // [1, 2, 3, 4]
 */
export function uniq(array) {
  return array.filter((value, index, self) => self.indexOf(value) === index)
}

/**
 * Returns if a function call is a template literal call or a standart function call.
 * @param {args} args
 * @returns {Boolean}
 * @example
 * import { isTag } from './utils'
 *
 * function hello(args) {
 *   return isTag(args)
 * }
 *
 * hello('world') // false
 * hello`world` // true
 */
export function isTag(args) {
  return {}.toString.call(args) === '[object Array]' && !!args.raw
}

/**
 * Returns if the current environment is browser.
 * Simply checks if the `Window` element exists.
 * @returns {Boolean}
 */
export function isBrowser() {
  return typeof window !== 'undefined' && {}.toString.call(window) === '[object Window]'
}

/**
 * Flattens nested objects. Generates path string with `_`.
 * @param {Object} object The object to be flatten
 * @returns {Object} The flatten object
 * @example
 * flatten({
 *   a: {
 *     b: 2,
 *     d: {
 *       e: 4
 *     }
 *   },
 *   c: 3,
 *   d: [4, 5]
 * })
 * //
 * // returns:
 * // {
 * //   a_b: 2,
 * //   a_b_d_e: 4
 * //   c: 3,
 * //   d_0: 4,
 * //   d_1: 5
 * // }
 *
 *
 */
export function flatten(object, prefix = '', out = {}) {
  for (let name in object) {
    if (object.hasOwnProperty(name)) {
      typeof object[name] === 'object'
        ? flatten(object[name], `${prefix}${name}_`, out)
        : (out[prefix + name] = object[name])
    }
  }
  return out
}

// // https://github.com/burakcan/mb
// const mb = p => o => p.map(c => (o = (o || {})[c])) && o

// export function get(object, path) {
//   return mb(path.split('.'))(object)
// }
