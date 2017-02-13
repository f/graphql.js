.PHONY: test

build:
	google-closure-compiler-js --createSourceMap=true graphql-client.js > graphql-client.min.js

test:
	node test/test.js