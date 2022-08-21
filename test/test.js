// to fake out graphql to use XHR, so we can stub it
global.XMLHttpRequest = null;

let {mockRandom} = require('jest-mock-random');
let graphql = require('../graphql.js');

// Mock XMLHttpRequest
function mockXHR(status, data) {
    const xhrMockObj = {
        open: jest.fn(),
        send: jest.fn(),
        setRequestHeader: jest.fn(),
        onload: jest.fn(),
        readyState: 4,
        status: status,
        responseText: JSON.stringify(data),
    };

    const xhrMockClass = () => xhrMockObj;

    global.XMLHttpRequest = jest.fn().mockImplementation(xhrMockClass);

    xhrMockObj.send = (body) => {
        xhrMockObj.sentBody = body;
        xhrMockObj.onload();
    }
    return xhrMockObj;
}

/* global client, method, url, fetchPost, fetchComments */
describe('graphql.js', () => {
    set('url', () => null);
    set('method', () => 'put');
    set('client', () =>
        graphql(url, {
            method: method,
            asJSON: true,
            fragments: {
                user: 'on User {name}',
                auth: {
                    user: 'on User {token, ...user}'
                }
            }
        }));

    it('client should be a function', () => {
        expect(typeof client).toBe('function');
    });

    describe('.fragment()', () => {
        it('registers a new fragment', () => {
            client.fragment({
                auth: {
                    error: 'on Error {messages}'
                }
            });

            expect(client.fragment('auth.error')).toBe(
                'fragment auth_error on Error {messages}'
            );
        });
    });

    describe('.getOptions()', () => {
        it('configures the method as requested', () => {
            expect(client.getOptions().method).toBe('put');
        });
    });

    describe('.fragments()', () => {
        it('returns an object with the defined fragments as properties', () => {
            expect(client.fragments()).toStrictEqual(
                expect.objectContaining({
                    user: '\nfragment user on User {name}',
                    auth_user: '\nfragment auth_user on User {token, ...user}',
                })
            );
        });

        it('returns new registered fragments as well', () => {
            client.fragment({
                auth: {
                    error: 'on Error {messages}'
                }
            });

            expect(client.fragments()).toStrictEqual(
                expect.objectContaining({
                    auth_error: '\nfragment auth_error on Error {messages}',
                })
            );
        });
    });

    describe('@autodeclare queries', () => {
        let queryIn = `query (@autodeclare) {
	user(name: $name, bool: $bool, int: $int, id: $id) {
		...auth.user
		...auth.error
	}
	x {
		... auth.user
	}
}`;

        it('mixes in the requested fragments and sets the data types', () => {
            client.fragment({
                auth: {
                    error: 'on Error {messages}'
                }
            });

            var expectedQuery = `query ($name: String!, $bool: Boolean!, $int: Int!, $float: Float!, $id: ID!, $user_id: Int!, $postID: ID!, $custom_id: CustomType!, $customId: ID!, $target: [ID!]!) {
	user(name: $name, bool: $bool, int: $int, id: $id) {
		... auth_user
		... auth_error
	}
	x {
		... auth_user
	}
}

fragment user on User {name}

fragment auth_user on User {token, ...user}

fragment auth_error on Error {messages}`;

            let query = client.buildQuery(queryIn, {
                name: 'fatih',
                bool: true,
                int: 2,
                float: 2.3,
                id: 1,
                'user_id!': 2,
                'postID': '45af67cd',
                'custom_id!CustomType': '1',
                'customId': '1',
                'target![ID!]': ['Q29uZ3JhdHVsYXRpb25z']
            });

            expect(query).toBe(expectedQuery);
        });
    });

    describe('.query()', () => {
        it('returns a function', () => {
            let query = client.query(`($email: String!, $password: String!) {
                auth(email: $email, password: $password) {
                    ... on User {
                        token
                    }
                }
            }`);
            expect(typeof query).toBe('function');
        });
    });

    describe('.getUrl()/setUrl()', () => {
        it('updates the url', () => {
            client.headers({'User-Agent': 'Awesome-Octocat-App'});

            client.query(`
                repository(owner:"f", name:"graphql.js") {
                    issues(last:20, states:CLOSED) {
                        edges {
                            node {
                                title
                                url
                            }
                        }
                    }
                }`);

            // check old URL
            expect(client.getUrl()).toBeNull();
            // set new URL
            var newUrl = 'https://api.github.com/graphql'
            client.setUrl(newUrl)
            expect(client.getUrl()).toBe(newUrl);
        })
    });

    describe('query testing', () => {
        set('fetchPost', () => client.query(`{
  post(id: $id) {
    id
    title
    text
  }
}`));
        set('fetchComments', () => client.query(`{
  commentsOfPost: comments(postId: $postId) {
    comment
    owner {
      name
    }
  }
}`));

        set('url', () => 'https://example.org');

        describe('when method is GET', () => {
            set('method', () => 'get');

            it('makes the request passing the parameters as query arguments', () => {
                let xhr = mockXHR(200, {});
                xhr.send = jest.fn();
                fetchPost({id: 123});
                expect(xhr.send).toHaveBeenCalledWith(undefined);
                expect(xhr.open).toHaveBeenCalledWith(method, expect.stringMatching(url), true)
                expect(xhr.open).toHaveBeenCalledWith(method, expect.stringMatching(/\?query=.+&variables=/), true)
            });
        });

        describe('when executing the queries normally', () => {
            it('sends a network request right away', () => {
                let xhr = mockXHR(200, {});
                xhr.send = jest.fn();
                fetchPost({id: 123});
                expect(xhr.send).toHaveBeenCalled();
            });

            it('resolves the response in the promise', () => {
                let data = {post: {id: 123, title: 'title', text: 'text'}};
                mockXHR(200, data);
                return expect(fetchPost({id: 123})).resolves.toStrictEqual(data);
            });

            it('sends the correctly formatted request to the server', () => {
                let xhr = mockXHR(200, {});
                return fetchPost({id: 123}).then(() => {
                    expect(JSON.parse(xhr.sentBody)).toStrictEqual({
                        "query": "query {\n  post(id: $id) {\n    id\n    title\n    text\n  }\n} ",
                        "variables": {"id": 123}
                    });
                });
            });
        });

        describe('.merge()/.commit()', () => {
            it('does not send the request when using merge', () => {
                let xhr = mockXHR(200, {});
                xhr.send = jest.fn();
                fetchPost.merge('buildPage', {id: 123});
                expect(xhr.send).not.toHaveBeenCalled();
            });

            it('sends the request when commit is called', () => {
                let xhr = mockXHR(200, {});
                xhr.send = jest.fn();
                fetchPost.merge('buildPage', {id: 123});
                expect(xhr.send).not.toHaveBeenCalled();

                client.commit('buildPage');
                expect(xhr.send).toHaveBeenCalled();
            });

            it('sends the correctly formatted request to the server', () => {
                let xhr = mockXHR(200, {});
                fetchPost.merge('buildPage', {id: 123});
                mockRandom(0.1234);
                return client.commit('buildPage').then(() => {
                    expect(JSON.parse(xhr.sentBody)).toStrictEqual({
                        "query": "query ($merge1234__id: ID!) {\nmerge1234_post:post(id: $merge1234__id) {\n    id\n    title\n    text\n  }\n }",
                        "variables": {
                            "merge1234__id": 123
                        }
                    });
                });
            });

            describe('when merging multiple queries', () => {
                it('sends the correctly formatted merged request to the server', () => {
                    let xhr = mockXHR(200, {});
                    let postId = 123;
                    fetchPost.merge('buildPage', {id: postId});
                    fetchComments.merge('buildPage', {postId: postId});
                    mockRandom(0.1234);
                    return client.commit('buildPage').then(() => {
                        expect(JSON.parse(xhr.sentBody)).toStrictEqual({
                            "query": "query ($merge1234__id: ID!, $merge1234__postId: ID!) {\n"
                                + "merge1234_post:post(id: $merge1234__id) {\n    id\n    title\n    text\n  }\n"
                                + "merge1234_commentsOfPost: comments(postId: $merge1234__postId) {\n    comment\n    owner {\n      name\n    }\n  }\n"
                                +" }",
                            "variables": {
                                "merge1234__id": 123,
                                "merge1234__postId": 123,
                            }
                        });
                    });
                });
            });
        });
    });
});
