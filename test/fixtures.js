export const fragmentPlain = `on Type {
  a
  b
}`

export const fragmentWithAlias = `on Type {
  a
  b: c
}`

export const fragmentNested = `on Type {
  a
  b {
    c
  }
}`

export const fragmentWithFragment = `on Type {
  ...a
}`

export const fragmentWithNestedFragment = `on Type {
  ...a.b.c
}`

export const queryPlain = `{
  a
  b
}`

export const queryWithQuery = `query {
  a
  b
}`

export const queryWithVariables = `query ($name: String!) {
  a(name: $name)
  b
}`

export const mutationWithVariables = `mutation ($name: String!, $email: String!) {
  a(name: $name, email: $email) {
    b
  }
  c
}`

export const queryWithAutodeclare = `query (@autodeclare) {
  a(name: $name)
  b
}`

export const mutationWithAutodeclare = `mutation (@autodeclare) {
  a(name: $name, email: $email) {
    b
  }
  c
}`
