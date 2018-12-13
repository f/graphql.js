import { uniq, isTag, isBrowser, flatten } from '../src/utils'

describe(uniq, () => {
  it('makes arrays uniq', () => {
    expect(uniq([1, 2, 3])).toEqual([1, 2, 3])
    expect(uniq([1, 2, 2, 3])).toEqual([1, 2, 3])
    expect(uniq([1, 1, 1, 3])).toEqual([1, 3])
    expect(uniq([true, false, false])).toEqual([true, false])
    expect(uniq(['a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
    expect(uniq(['a', 'a', 'c'])).toEqual(['a', 'c'])
  })
})

describe(isTag, () => {
  it('detects if the call is tag', () => {
    function testTag(strings) {
      return isTag(strings)
    }

    expect(testTag`query {${1} ${2}}`).toEqual(true)
    expect(testTag(`query {${1} ${2}}`)).toEqual(false)
  })
})

describe(isBrowser, () => {
  it('environment is browser', () => {
    expect(isBrowser()).toEqual(true)
  })
})

describe(flatten, () => {
  it('flattens the nested object into one level object', () => {
    expect(flatten({ a: 1 })).toEqual({ a: 1 })
    expect(flatten({ a_b_c: 1 })).toEqual({ a_b_c: 1 })
    expect(flatten({ a: { b: { c: 1 } } })).toEqual({ a_b_c: 1 })
    expect(
      flatten({
        a: {
          b: { c: 1 }
        },
        d: {
          e: { f: 2 }
        }
      })
    ).toEqual({ a_b_c: 1, d_e_f: 2 })
    expect(
      flatten({
        a: {
          b: {
            c: {
              g: { h: 1, j: 2 },
              l: { m: [3], n: 4 }
            }
          }
        },
        d: {
          e: { f: 5 }
        }
      })
    ).toEqual({
      a_b_c_g_h: 1,
      a_b_c_g_j: 2,
      a_b_c_l_m_0: 3,
      a_b_c_l_n: 4,
      d_e_f: 5
    })
  })
})
