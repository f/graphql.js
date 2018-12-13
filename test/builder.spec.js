import { buildFragments, findType, autoDeclare, cleanKeys } from '../src/builder'

describe(buildFragments, () => {
  it('builds fragments', () => {
    expect(
      buildFragments({
        a: `on Type1 { a, b }`,
        b: {
          c: `on Type2 { c, d }`,
          d: {
            e: `on Type3 { e }`
          }
        },
        x: null
      })
    ).toEqual({
      a: 'fragment a on Type1 { a, b }',
      b_c: 'fragment b_c on Type2 { c, d }',
      b_d_e: 'fragment b_d_e on Type3 { e }'
    })
  })

  it('cannot build fragments without `on Type` syntax', () => {
    expect(() => buildFragments({ b: 1 })).toThrowError('Fragments must start with `on {TypeName}`')
    expect(() => buildFragments({ b: true })).toThrowError('Fragments must start with `on {TypeName}`')
    expect(() => buildFragments({ b: function() {} })).toThrowError('Fragments must start with `on {TypeName}`')
    expect(() => buildFragments({ b: 'deneme' })).toThrowError('Fragments must start with `on {TypeName}`')
    expect(() => buildFragments({ b: null })).not.toThrow()
  })
})

describe(findType, () => {
  it('finds types', () => {
    expect(findType('a', 1)).toEqual({ key: 'a', value: 1, type: 'Int' })
    expect(findType('bb', 1.2)).toEqual({ key: 'bb', value: 1.2, type: 'Float' })
    expect(findType('ccc', 'hello')).toEqual({ key: 'ccc', value: 'hello', type: 'String' })
    expect(findType('dddd', false)).toEqual({ key: 'dddd', value: false, type: 'Boolean' })
  })

  it('finds forced types', () => {
    expect(findType('a!Hey', 1)).toEqual({ key: 'a', value: 1, type: 'Hey' })
    expect(findType('bb!Hello', 1)).toEqual({ key: 'bb', value: 1, type: 'Hello' })
  })

  it('finds IDs', () => {
    expect(findType('a_id', 1)).toEqual({ key: 'a_id', value: 1, type: 'ID' })
    expect(findType('aId', 1)).toEqual({ key: 'aId', value: 1, type: 'ID' })
    expect(findType('aID', 1)).toEqual({ key: 'aID', value: 1, type: 'ID' })
    expect(findType('aiD', 1)).toEqual({ key: 'aiD', value: 1, type: 'ID' })
    expect(findType('a_id_x', 1)).toEqual({ key: 'a_id_x', value: 1, type: 'Int' })
    expect(findType('a_ID_x', 1)).toEqual({ key: 'a_ID_x', value: 1, type: 'Int' })
  })
})

describe(autoDeclare, () => {
  it('autodeclares', () => {
    expect(autoDeclare('hello (@autodeclare) world')).toEqual('hello  world')
    expect(autoDeclare('hello (@autodeclare) world', { a: 1 })).toEqual('hello ($a: Int!) world')
    expect(autoDeclare('hello (@autodeclare) world', { b: 1, c: 'hey', d: true, z_id: 1 })).toEqual(
      'hello ($b: Int!, $c: String!, $d: Boolean!, $z_id: ID!) world'
    )
  })

  it('cannot autodeclare unknown types: object, function and undefined', () => {
    expect(() => {
      autoDeclare('(@autodeclare)', { b: { c: 2 } })
    }).toThrowError('object is not a detectable type for graphql.js')

    expect(() => {
      autoDeclare('(@autodeclare)', { b: function() {} })
    }).toThrowError('function is not a detectable type for graphql.js')

    expect(() => {
      autoDeclare('(@autodeclare)', { b: undefined })
    }).toThrowError('undefined is not a detectable type for graphql.js')
  })
})

describe(cleanKeys, () => {
  it('cleans annotations on keys', () => {
    expect(cleanKeys({ a: 1 })).toEqual({ a: 1 })
    expect(cleanKeys({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 })
    expect(cleanKeys({ a: 1, 'b!hey': 2 })).toEqual({ a: 1, b: 2 })
    expect(cleanKeys({ 'a!x': 1, 'b!y': 2 })).toEqual({ a: 1, b: 2 })
  })
})
