.PHONY: test

build:
	uglifyjs graphql.js -o graphql.min.js

test:
	node test/test.js
