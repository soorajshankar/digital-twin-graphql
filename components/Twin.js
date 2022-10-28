import Head from "next/head";
import Image from "next/image";
import { useEffect } from "react";
import { start, useDigitalTwin } from "../lib/twin";
let started = false;

const Home = () => {
  const ss = useDigitalTwin();
  // useEffect(() => {
  //   if (!started) {
  //     // start();
  //     started = true;
  //   }

  //   return () => {
  //     // second
  //   };
  // }, []);

  return <div id="container"></div>;
};

export default Home;
