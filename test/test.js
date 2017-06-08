var assert = require('assert')
var graphql = require('../graphql.js')

var client = graphql(null, {
  method: "put",
  fragments: {
    user: "on User {name}",
    auth: {
      user: "on User {token, ...user}"
    }
  }
})

client.fragment({
  auth: {
    error: "on Error {messages}"
  }
})
assert.equal(typeof client, "function")
assert.equal(client.fragment('auth.error'), "fragment auth_error on Error {messages}")
assert.equal(client.getOptions().method, "put")
assert.equal(client.fragments().user, "\nfragment user on User {name}")
assert.equal(client.fragments().auth_user, "\nfragment auth_user on User {token, ...user}")
assert.equal(client.fragments().auth_error, "\nfragment auth_error on Error {messages}")

var queryIn = `query (@autodeclare) {
  user(name: $name, bool: $bool, int: $int) {
    ...auth.user
    ...auth.error
  }
  x {
    ... auth.user
  }
}`

var expectedQuery = `query ($name: String!, $bool: Boolean!, $int: Int!, $float: Float!) {
  user(name: $name, bool: $bool, int: $int) {
    ... auth_user
    ... auth_error
  }
  x {
    ... auth_user
  }
}

fragment user on User {name}

fragment auth_user on User {token, ...user}

fragment auth_error on Error {messages}`

assert.equal(client.buildQuery(queryIn, {name: "fatih", bool: true, int: 2, float: 2.3}), expectedQuery)

assert.equal(typeof client.query(`($email: String!, $password: String!) {
  auth(email: $email, password: $password) {
    ... on User {
      token
    }
  }
}`), "function")