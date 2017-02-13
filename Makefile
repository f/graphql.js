.PHONY: test

build:
	google-closure-compiler-js graphql.js > graphql.min.js

test:
	node test/test.js