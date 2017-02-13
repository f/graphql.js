.PHONY: test

build:
	google-closure-compiler-js --createSourceMap=true graphql.js > graphql.min.js

test:
	node test/test.js