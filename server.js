const {
  ApolloServer,
  PubSub,
  AuthenticationError,
  UserInputError,
  ApolloError,
  SchemaDirectiveVisitor,
} = require("apollo-server");
const { defaultFieldResolver, GraphQLString } = require("graphql");
const gql = require("graphql-tag");

const pubSub = new PubSub();
const NEW_ITEM = "NEW_ITEM";

class LogDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;

    field.args.push({
      type: GraphqlString,
      name: "message",
    });

    field.resolve = (root, { message, ...rest }, ctx, info) => {
      const { message: schemaMessage } = this.args;
      console.log("👨🏽‍🚀 Hi", message || schemaMessage);
      return resolver.call(this, root, rest, ctx, info);
    };
  }
}

const typeDefs = gql`
  directive @log(message: String = "my message") on FIELD_DEFINITION

  type User {
    id: ID! @log(message: "id here")
    error: String! @deprecated(reason: "use this other field")
    username: String!
    createdAt: String!
  }

  type Settings {
    user: User!
    theme: String!
  }

  type Item {
    task: String!
  }

  input NewSettingsInput {
    user: ID!
    theme: String!
  }

  type Query {
    me: User!
    settings(user: ID!): Settings!
  }

  type Mutation {
    settings(input: NewSettingsInput!): Settings!
    createItem(task: String!): Item!
  }

  type Subscription {
    newItem: Item!
  }
`;

const resolvers = {
  Query: {
    me() {
      return {
        id: 1,
        username: "coder12",
        createdAt: 23048230,
      };
    },
    settings(_, { user }) {
      return {
        user,
        theme: "light",
      };
    },
  },

  Mutation: {
    settings(_, { input }) {
      return input;
    },
    createItem(_, { task }) {
      const item = { task };
      pubSub.publish(NEW_ITEM, { newItem: item });
      return item;
    },
  },

  Subscription: {
    newItem: {
      subscribe: () => pubSub.asyncIterator(NEW_ITEM),
    },
  },

  Settings: {
    user(settings) {
      return {
        id: 1,
        username: "coder12",
        createdAt: 23048230,
      };
    },
  },

  User: {
    error() {
      throw new UserInputError("wrong fields");
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives: {
    log: LogDirective,
  },
  context({ connection, req }) {
    if (connection) {
      return { ...connection.context };
    }
  },
  subscription: {
    onConnect(params) {},
  },
});

server.listen().then(({ url }) => console.log(`🚀 Server running at ${url}`));
