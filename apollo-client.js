import { ApolloClient, InMemoryCache } from "@apollo/client";
import { split, HttpLink } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";

const wsLink =
  typeof window !== "undefined"
    ? new GraphQLWsLink(
        createClient({
          url: "ws://localhost:8080/v1/graphql",
        })
      )
    : null;

const httpLink = new HttpLink({
  uri: `http://localhost:8080/v1/query`,
});

const splitLink =
  typeof window !== "undefined" && wsLink != null
    ? split(
        ({ query }) => {
          const def = getMainDefinition(query);
          return (
            def.kind === "OperationDefinition" &&
            def.operation === "subscription"
          );
        },
        wsLink,
        httpLink
      )
    : httpLink;

const client = new ApolloClient({
  // uri: "https://countries.trevorblades.com",
  link: splitLink,
  cache: new InMemoryCache(),
});

export default client;
