"use client";

import dynamic from "next/dynamic";

const Footer = dynamic(() => import("@/components/Common/Footer/Footer"), {
  ssr: false,
  loading: () => null,
});

const MusicPlayer = dynamic(() => import("@/components/MusicPlayer/MusicPlayer"), {
  ssr: false,
  loading: () => null,
});

const ClientShell = () => {
  return (
    <>
      <Footer />
      <MusicPlayer />
    </>
  );
};

export default ClientShell;
