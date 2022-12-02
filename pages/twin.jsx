import Head from "next/head";
import Image from "next/image";
import { useEffect } from "react";
import Twin from "../components/Twin";
import { start } from "../lib/twin";
let started = false;

const Home = () => {
  return (
    <div className="">
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Twin />
      </main>
    </div>
  );
};

export default Home;
