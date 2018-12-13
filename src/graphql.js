import request from './request'

request({
  method: 'post',
  url: 'https://graphql-pokemon.now.sh',
  data: {
    query: 'query ($name: String!) { pokemon(name: $name) { id } }',
    variables: {
      name: 'Pikachu'
    }
  },
  debugMode: true
})
