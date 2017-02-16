var assert = require('assert')
var graphql = require('../graphql.js')

var client = graphql(null, {
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
assert.equal(typeof client, "function")
assert.equal(client.fragment('auth.error'), "fragment authError on Error {messages}")
assert.equal(client.getOptions().method, "put")
assert.equal(client.fragments().user, "\nfragment user on User {name}")
assert.equal(client.fragments().auth_user, "\nfragment authUser on User {token}")
assert.equal(client.fragments().auth_error, "\nfragment authError on Error {messages}")

var queryIn = `query (@autotype) {
  user(name: $name, bool: $bool, int: $int) {
    ...user
    ...auth.error
  }
}`

var expectedQuery = `query ($name: String!, $bool: Boolean!, $int: Int!) {
  user(name: $name, bool: $bool, int: $int) {
    ... user
    ... authError
  }
}

fragment user on User {name}

fragment authError on Error {messages}`

assert.equal(client.buildQuery(queryIn, {name: "fatih", bool: true, int: 2}), expectedQuery)

assert.equal(typeof client.query(`($email: String!, $password: String!) {
  auth(email: $email, password: $password) {
    ... on User {
      token
    }
  }
}`), "function")