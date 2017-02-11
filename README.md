# jQuery GraphQL

> This is a simple library that uses jQuery's `$.ajax` method, `$.Deferred` and some utilities like `$.each`, and a very naive fragment implementation based on [**Richard Mosolgo**](http://github.com/rmosolgo)'s [**Using GraphQL Without Relay** post](http://rmosolgo.github.io/blog/2016/03/03/using-graphql-without-relay/).

### Features

- No bullshit depended, just jQuery to use its `$.ajax` and some utilities.
- Plug & Play.
- Runs on most of the browsers.
- You don't need to install Node.js ecosystem into your computer.

## Overview

GraphQL based on a very simple HTTP transaction which sends a request to an endpoint
with `query` and `variables`.

Many libraries requires _complex stacks_ to make that simple request.
In any project you don't use **React**, **Relay** you'll need a simpler
client which manages your query and makes a simple request.

```js
// Connect...
var graph = $.graphql("/graphql")

// Query...
graph.run(`query { allUsers {id, name} }`).then(function (users) {
  console.log(users)
})
```

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

## Executing Queries and Mutations

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

### Prepare Query for Lazy Execution

You can prepare queries for lazy execution. It will allow you to reuse your queries with
different variables without any hassle.

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

#### Direct Execution with `.run`

If your query doesn't need any variable, it will generate a lazy execution query by default.
If you want to run your query immediately, you have two following options:

```js
// 1st. create and run function.
graph(`...`)()
graph.query(`...`)()
graph.mutate(`...`)()
//...

// 2nd. create and run function with `run` method.
graph.run(`...`)
graph.query.run(`...`)
graph.mutate.run(`...`)
```

### Prefix Helpers

You can prefix your queries by simply calling helper methods: `.query`, `.mutate` or `.subscribe`

```js
var login = graph.query(`($email: String!, $password: String!) {
  auth(email: $email, password: $password) {
    ... on User {
      token
    }
  }
}`)

var increment = graph.mutate(`increment { state }`)
var onIncrement = graph.subscribe(`onIncrement { state }`)
```

### Autotyping with `@autotype`

Declaring simple-typed (`String`, `Int`, `Boolean`) variables in query were a
little bothering to me. That's why I added an `@autotype` keyword to the processor.
It detects types from the variables and declares them in query automatically.

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

### Advanced Autotyping

You can define custom types when defining variables by using a simple `"variable!Type"` notation.
It will help you to make more complex variables:

```js
var register = graph.mutate(`(@autotype) {
  userRegister(input: $input) { ... }
}`)

register({
  // variable name and type.
  "input!UserRegisterInput": { ... }
})
```

This will generate following query:

```js
mutation ($input: UserRegisterInput!) {
  userRegister(input: $input) { ... }
}
```

## Fragments

Fragments make your GraphQL more DRY and improves reusability. With `.fragment` method, you'll
manage your fragments easily.

### Simple Fragments

While constructing your endpoint, you can predefine all of your fragments.

```js
var graph = $.graphql("/graphql", {
  fragments: {
    userInfo: `on User { id, name, surname, avatar }`
  }
})
```

And you can use your fragments in your queries. The query will pick your fragments and
will add them to the bottom of your query.

```js
graph.query(`{ allUsers { ...userInfo } }`)
```

### Nested Fragments

You can nest your fragments to keep them organized/namespaced.

```js
var graph = $.graphql("/graphql", {
  fragments: {
    user: {
      info: `on User { id, name, surname, avatar }`
    }
  }
}) 
```

Accessing them is also intuitive:

```js
graph.query(`{ allUsers { ...user.info } }`)
```

### Lazy Fragments

You can also add fragments lazily. So you can use your fragments more modular.

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

Also you can add **nested fragments** lazily, too:

```js
graph.fragment({
  login: {
    error: `on LoginError {
      reason
    }`
  }
})

graph.fragment({
  something: {
    error: `on SomeError {
      messages
    }`
  }
})

graph.query(`{ login {... login.error } }`)
graph.query(`{ something {... something.error } }`)
```

## TODO

 - [ ] Remove jQuery dependencies and rename project.

## License

MIT.
