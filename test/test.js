var assert = require('assert')
var GraphQLClient = require('../graphql.js')

var client = new GraphQLClient(null, {
  method: "put",
  fragments: {
    user: "on User {name}",
    auth: {
      user: "on User {token}"
    }
  }
})

client.fragment({
  auth: {
    error: "on Error {messages}"
  }
})

assert.equal(client.options.method, "put")
assert.equal(client._fragments.user, "\nfragment user on User {name}")
assert.equal(client._fragments.auth_user, "\nfragment auth_user on User {token}")
assert.equal(client._fragments.auth_error, "\nfragment auth_error on Error {messages}")

var queryIn = `query (@autotype) {
  user(name: $name, bool: $bool, int: $int) {
    ...user
    ...auth.error
  }
}`

var expectedQuery = `query ($name: String!, $bool: Boolean!, $int: Int!) {
  user(name: $name, bool: $bool, int: $int) {
    ...user
    ...auth_error
  }
}

fragment user on User {name}

fragment auth_error on Error {messages}`

assert.equal(client.buildQuery(queryIn, {name: "fatih", bool: true, int: 2}), expectedQuery)

assert.equal(typeof client.query(`($email: String!, $password: String!) {
  auth(email: $email, password: $password) {
    ... on User {
      token
    }
  }
}`), "function")