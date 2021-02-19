const {
  ApolloServer,
  PubSub,
  AuthenticationError,
  UserInputError,
  ApolloError,
} = require("apollo-server");
const gql = require("graphql-tag");

const pubSub = new PubSub();
const NEW_ITEM = "NEW_ITEM";

const typeDefs = gql`
  type User {
    id: ID!
    error: String!
    username: String!
    createdAt: Int!
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
  formatError(e) {
    console.log(e);
    return e;
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
