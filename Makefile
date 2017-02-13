.PHONY: test

build:
	uglify -s graphql.js -o graphql.min.js

test:
	node test/test.js