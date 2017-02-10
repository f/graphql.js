# jQuery GraphQL

> This is a simple library that uses jQuery's `$.ajax` method, `$.Deferred` and some utilities like `$.each`, and a very naive fragment implementation based on [**Richard Mosolgo**](http://github.com/rmosolgo)'s [**Using GraphQL Without Relay** post](http://rmosolgo.github.io/blog/2016/03/03/using-graphql-without-relay/).

## Installation

```html
<script src="/path/to/jquery.js"></script>
<script src="/path/to/jquery-graphql.js"></script>
```

## Connection

Create a simple connection to your GraphQL.

```js
var graph = $.graphql("http://localhost:3000/graphql", {
  // headers
  "Access-Token": "some-access-token"
}, {
  // fragments, you don't need to say `fragment name`.
  auth: "on User { token }",
  error: "on Error { messages }"
})
```

## Execute Query

`graph` will be a simple function that accepts `query` and `variables` as parameters.

```js
graph(`query login($email: String!, $password: String!) {
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

## License

MIT.
