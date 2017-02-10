# jQuery GraphQL

> This is a simple library that uses jQuery's `$.ajax` method, `$.Deferred` and some utilities like `$.each`, and a very naive fragment implementation based on [**Richard Mosolgo**](http://github.com/rmosolgo)'s [**Using GraphQL Without Relay** post](http://rmosolgo.github.io/blog/2016/03/03/using-graphql-without-relay/).

### Features

- No bullshit depended, just jQuery to use its `$.ajax` and some utilities.
- Plug & Play.
- Runs on most of the browsers.
- You don't need to install Node.js ecosystem into your computer.

## Installation

```html
<script src="/path/to/jquery.js"></script>
<script src="/path/to/jquery-graphql.js"></script>
```

## Connection

Create a simple connection to your GraphQL.

```js
var graph = $.graphql("http://localhost:3000/graphql", {
  headers: {
    // headers
    "Access-Token": "some-access-token"
  },
  fragments: {
    // fragments, you don't need to say `fragment name`.
    auth: "on User { token }",
    error: "on Error { messages }"
  }
})
```

## Execute Query

`graph` will be a simple function that accepts `query` and `variables` as parameters.

```js
graph(`query ($email: String!, $password: String!) {
  auth(email: $email, password: $password) {
    ... auth # if you use any fragment, it will be added to the query.
    ... error
  }
}`, {
  email: "john@doe.com",
  password: "my-super-password"
}).then(function (response) {
  // response is originally response.data of query result
  console.log(response)
}).catch(function (error) {
  // response is originally response.errors of query result
  console.log(error)
})
```

## Prepare Query for Execution

You can prepare queries for lazy execution.

```js
var login = graph(`query ($email: String!, $password: String!) {
  auth(email: $email, password: $password) {
    ... on User {
      token
    }
  }
}`)

// Call it later...
login({
  email: "john@doe.com",
  password: "my-super-password"
})
```

## Prefix Helpers

You can prefix your queries by simply calling helper methods: `.query`, `.mutate` or `.subscribe`

```js
var login = graph.query(`($email: String!, $password: String!) {
  auth(email: $email, password: $password) {
    ... on User {
      token
    }
  }
}`)

var passwordUpdate = graph.mutate(`...`)
var userAdded = graph.subscribe(`...`)
```

## Autotyping `@autotype`

Declaring simple-typed (`String`, `Int`, `Boolean`) variables in query may be a
little bothering to me. That's why I added an `@autotype` keyword to the processor.
It detects and adds types to the query.

```js
var login = graph.query(`(@autotype) {
  auth(email: $email, password: $password) {
    ... on User {
      token
    }
  }
}`)

login({
  email: "john@doe.com", // It's String! obviously.
  password: "my-super-password" // It is, too.
})
```

This will create following query:

```js
query ($email: String!, $password: String!) {
  auth(email: $email, password: $password) {
    ... on User {
      token
    }
  }
}
```

### A little bit advanced autotyping

You can define custom types when defining variables by using a simple `"variable!Type"` notation:

```js
graph.fragment({registeredUser: `
  ... on User {
    id
    name
    token
  }
`})

var register = graph.mutate(`(@autotype) {
  userRegister(input: $input) {
    ... registeredUser
  }
}`)

register({
  // variable name and type.
  "input!UserRegisterInput": {
    ...
  }
})
```

This will generate following query:

```js
mutation ($input: UserRegisterInput!) {
  userRegister(input: $input) {
    ... registeredUser
  }
}

fragment registeredUser on User {
  ... on User {
    id
    name
    token
  }
}
```

## Adding Fragments Lazily

You can add fragments lazily.

```js
// Adds a profile fragment
graph.fragment({
  profile: `on User {
    id
    name(full: true)
    avatar
  }`
})

var allUsers = graph.query(`{
  allUsers {
    ... profile
  }
}`)

allUsers().then(...)
```

## License

MIT.
