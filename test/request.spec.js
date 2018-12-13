import { tryToParseJSON, generateRequestHeaders, generateRequestBody } from '../src/request'

describe(tryToParseJSON, () => {
  it('parses object on correct json', () => {
    expect(tryToParseJSON('{"a": 1}')).toEqual({ a: 1 })
    expect(tryToParseJSON('{"a": [1, "b"]}')).toEqual({ a: [1, 'b'] })
  })

  it('parses to text on corrupt json', () => {
    expect(tryToParseJSON('{a: 1}')).toEqual('{a: 1}')
    expect(tryToParseJSON('{a: [1, "b"]}')).toEqual('{a: [1, "b"]}')
  })
})

describe(generateRequestHeaders, () => {
  it('generates headers for json', () => {
    expect(generateRequestHeaders({ a: 1, b: 2 })).toEqual({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      a: 1,
      b: 2
    })
  })

  it('generates headers for post data', () => {
    expect(generateRequestHeaders({ a: 1, b: 2 }, false)).toEqual({
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      a: 1,
      b: 2
    })
  })
})

describe(generateRequestBody, () => {
  const query = `
  query (a: A!) {
    # comment
    it(a: $a) {
      ...a
      b
    }
  }
  `
  it('generates graphql request for json', () => {
    expect(generateRequestBody(query, { a: 1, b: [{ c: 2 }] })).toEqual(
      JSON.stringify({
        query,
        variables: { a: 1, b: [{ c: 2 }] }
      })
    )
  })

  it('generates graphql request for post data', () => {
    expect(generateRequestBody(query, { a: 1 }, false)).toEqual(
      'query=%0A%20%20query%20(a%3A%20A!)%20%7B%0A%20%20%20%20%23%20comment%0A%20%20%20%20it(a%3A%20%24a)%20%7B%0A%20%20%20%20%20%20...a%0A%20%20%20%20%20%20b%0A%20%20%20%20%7D%0A%20%20%7D%0A%20%20&variables=%7B%22a%22%3A1%7D'
    )
  })
})
