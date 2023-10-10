import Head from "next/head";
import { gql, useQuery } from "@apollo/client";

const GET_DOGS = gql`
  {
    __typename
  }
`;

const Home = () => {
  const { loading, error, data } = useQuery(GET_DOGS);

  if (loading) return "Loading...";
  if (error) return `Error! ${error.message}`;

  return (
    <div className="">
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <pre>{JSON.stringify({ data, loading, error }, null, 2)}</pre>
      </main>
    </div>
  );
};

export default Home;