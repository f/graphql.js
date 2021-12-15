let graphql = require('../graphql.js');

describe('graphql.js', () => {
    let client = null;

    beforeEach(() => {
        client = graphql(null, {
            method: 'put',
            fragments: {
                user: 'on User {name}',
                auth: {
                    user: 'on User {token, ...user}'
                }
            }
        });
        client.fragment({
            auth: {
                error: 'on Error {messages}'
            }
        });
    });

    it('client should be a function', () => {
        expect(typeof client).toBe('function');
    });

    describe('.fragment()', () => {
        it('registers a new fragment', () => {

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

        it('returns returns new fragments registered as well', () => {
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
});
