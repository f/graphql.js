# GraphQL.js - JavaScript GraphQL Client
[![Bower version](https://badge.fury.io/bo/graphql.js.svg)](http://badge.fury.io/bo/graphql.js)
[![NPM version](https://badge.fury.io/js/graphql.js.svg)](http://badge.fury.io/js/graphql.js)
[![Build Status](https://travis-ci.org/f/graphql.js.svg?branch=master)](https://travis-ci.org/f/graphql.js)

> This project was **jQuery-GraphQL** formerly. Now it's fully **independent**.
> Originally inspired by [Robert Mosolgo's blog post](http://rmosolgo.github.io/blog/2016/03/03/using-graphql-without-relay/)

### Features

- No dependencies, plain vanilla JavaScript.
- Plug & Play.
- Isomorphic.
- Runs on most browsers.
- You don't need to install Node.js ecosystem on your computer.

## Overview

GraphQL is based on a very simple HTTP transaction, which sends a request to an endpoint
with `query` and `variables`.

Many libraries require _complex stacks_ to make that simple request.
In any project you don't use **React**, **Relay**, you'll need a simpler
client which manages your query and makes a simple request.

```js
// Connect...
var graph = graphql("/graphql")

// Prepare...
var allUsers = graph(`query { allUsers {id, name} }`)

// Run...
allUsers().then(function (users) {
  console.log(users)
})
```

## Installation

You can download `graphql.js` directly, or you can use **Bower** or **NPM**.

#### Download for Browser

- [Development Version - 12kb](https://raw.githubusercontent.com/f/graphql.js/master/graphql.js)
- [Production Version - 6kb](https://raw.githubusercontent.com/f/graphql.js/master/graphql.min.js)

#### Using Bower
```bash
bower install graphql.js --save
```

#### Using NPM
```bash
npm install graphql.js --save

# or

yarn add graphql.js
```

#### Using with Rails Asset Pipeline

You can use GraphQL.js with Rails Asset Pipeline using [graphqljs-rails](https://github.com/f/graphqljs-rails).

## Using

GraphQL.js is **isomorphic**. You can use it in both **browser and Node.js**.

#### Use in Browser

```html
<script src="/path/to/graphql.js"></script>
```

#### Use in Node.js

```js
var graphql = require('graphql.js')
```

## Connection

Create a simple connection to your GraphQL endpoint.

```js
var graph = graphql("http://localhost:3000/graphql", {
  method: "POST", // POST by default.
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

You can prepare queries for lazy execution. This will allow you to reuse your queries with
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

#### Direct Execution with `.run` and ES6 Template Tag

If your query doesn't need any variables, it will generate a lazy execution query by default.
If you want to run your query immediately, you have three following options:

```js
// 1st option. create and run function.
graph(`...`)()
graph.query(`...`)()
graph.mutate(`...`)()
//...

// 2nd option. create and run function with `run` method.
graph.run(`...`)
graph.query.run(`...`)
graph.mutate.run(`...`)

// 3rd option. create and run function with template tag.
graph`...`
graph.query`...`
graph.mutate`...`
```

> **I don't recommend** using this. Using it too much may break DRY. Use lazy execution as much as possible.

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

var increment = graph.mutate`increment { state }`
var onIncrement = graph.subscribe`onIncrement { state }`
```

### Automatic Declaring with `@autodeclare` or `{declare: true}`

Declaring primitive-typed (`String`, `Int`, `Float`, `Boolean`) variables in query were a
little bothering to me. That's why I added an `@autodeclare` keyword or `{declare: true}` setting to the processor.
It detects types from the variables and declares them in query automatically.

```js
var login = graph.query(`(@autodeclare) {
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

You can also pass `{declare: true}` option to the `.query`, `.mutate` and `.subscribe` helper:

```js
var login = graph.query(`auth(email: $email, password: $password) {
  ... on User {
    token
  }
}`, {declare: true})
```

This will also create the same query above.

#### Solving `Integer` and `Float` Problem

Let's say you have a `rating` query that accepts an argument with a `Float` argument named `rating`.
GraphQL.js will declare `10` value as `Integer` since it casts using `value % 1 === 0 ? 'Int' : 'Float'` check.

```js
var rate = graph.query(`(@autodeclare) {
  rating(rating: $rating) {
    rating
  }
}`)

rate({
  rating: 10
})
```

In this case, you must use `!` mark to force your type to be `Float` as below:

```js
rate({
  "rating!Float": 10
})
```

This will bypass the casting and declare `rating` as `Float`.

### Advanced Auto Declaring

Beside you can pass `{declare: true}` to helpers:

```js
graph.query("auth(email: $email, password: $password) { token }", {declare: true})
```

Also you can enable auto declaration to run by default using `alwaysAutodeclare` setting.

```js
var graph = graphql("http://localhost:3000/graphql", {
  alwaysAutodeclare: true
})
```

After you enable `alwaysAutodeclare` option, your methods will try to detect types of variables and declare them.

```js
// When alwaysAutodeclare is true, you don't have to pass {declare: true} option.

graph.query("auth(email: $email, password: $password) { token }")
```

#### Auto Declaring Custom Types

You can define custom types when defining variables by using a simple `"variable!Type"` notation.
It will help you to make more complex variables:

```js
var register = graph.mutate(`(@autodeclare) {
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
var graph = graphql("/graphql", {
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
var graph = graphql("/graphql", {
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

### Using Fragments in Fragments

You can reuse fragments in your fragments.

```js
graph.fragment({
  user: "on User {name, surname}",
  login: {
    auth: "on User {token, ...user}"
  }
})
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

### Getting Fragments by Path

You can call fragment string by using `.fragment` method. You have to pass path string to get the fragment.

```js
graph.fragment('login.error')
```

This will give you the matching fragment code:

```js
fragment login_error on LoginError {
  reason
}
```

### Using Fragments in Tag Query

You can use fragments lazily using ES6 template tag queries.

```js
var userProfileToShow = graph.fragment('user.profile')

graph`query { ... ${userProfileToShow} }`
```

### Query Building

You can create queries using `.ql` **ES6 template tag**.

```js
// Add some fragments...
graph.fragment({
  username: {
    user: `on User {
      username
    }`,
    admin: `on AdminUser {
      username,
      administrationLevel
    }`
  }
})

// Get any fragment with its path...
var admin = graph.fragment('username.admin')

// Build your query with using fragment paths or dynamic template variables.
var query = graph.ql`query {
  ...username.user
  ...${admin}
}`

// Use query anywhere...
$.post("/graphql", {query: query}, function (response) { ... })
```

`graph.ql` will generate this query string:

```js
query {
  ... username_user
  ... username_admin
}

fragment username_user on User {
  username
}

fragment username_admin on AdminUser {
  username,
  administrationLevel
}
```

## Advanced
### Using with Vue.js

Create a `GraphQLProvider.js`.

```js
import graphql from 'graphql.js';

/* eslint-disable no-underscore-dangle */
export default {
  install(Vue, url, options) {
    Vue.mixin({
      created() {
        this._graph = graphql(url, options);
      },
    });
    Object.defineProperty(Vue.prototype, '$graph', {
      get() {
        return this._graph;
      },
    });
  },
};
```

And then you can use this with your Vue app:

```js
import Vue from 'vue';
import GraphQLProvider from './GraphQLProvider';

Vue.use(GraphQLProvider, 'http://localhost:3000/graphql', {
  headers: {
    // headers...
  },
});

// ... in your Vue VM
data() {
  return {
    hello: '',
  };
},
methods: {
  makeSomeQuery() {
    this.$graph.query(`{hello}`).then(response => {
      this.hello = response.hello;
    });
  },
}
```

### Change POST Method

As default, GraphQL.js makes a POST request. But you can change the behavior by setting `asJSON`.

```js
var graph = graphql("http://localhost:3000/graphql", {
  asJSON: true
});
```
### Using with `graphql-tag`

[`graphql-tag`](https://github.com/apollographql/graphql-tag) converts GraphQL query strings to AST. You can use `graphql-tag` with GraphQL.js

```js
graph.query(gql`query { name }`)
```

> Using `graphql-tag` will not allow you to use _auto declaration_ and _nested fragments_ syntaxes since these are not valid query syntax for GraphQL but only for this library.

### Change Url Anywhere

You can change url anywhere with `setUrl` method.

```js
var graph = graphql("http://localhost:3000/graphql", {
  asJSON: true
});

// Change url
graph.setUrl('http://www.example.com')

// Run query
graph.query(`{ name }`)
```

---

## Todo App Example

A CRUD ToDo app example code to show how to use GraphQL.js. An implementation can be found at [**f/graphql.js-demo**](https://github.com/f/graphql.js-demo)

```js
var graph = graphql("/graphql", {
  alwaysAutodeclare: true,
  fragments: {
    todo: `on Todo {
      id
      text
      isCompleted
    }`
  }
})

function getTodos() {
  return graph.query.run(`allTodos {
    ...todo
  }`)
}

function addTodo(text) {
  return graph.mutate(`todoAdd(text: $text) {
    ...todo
  }`, {
    text: text
  })
}

function setTodo(id, isCompleted) {
  return graph.mutate(`todoComplete(
    id: $id,
    status: $isCompleted
  ) {
    ...todo
  }`, {
    "id!ID": id,
    isCompleted: isCompleted
  })
}

function removeTodo(id) {
  return graph.mutate(`todoRemove(
    id: $id
  ) {
    ...todo
  }`, {
    "id!ID": id
  })
}
```

## License

MIT License

Copyright (c) 2017 Fatih Kadir Akın

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
