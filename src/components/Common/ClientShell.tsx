"use client";

import dynamic from "next/dynamic";
import AppRouteTransitionOverlay from "@/components/Common/AppRouteTransitionOverlay";

const Footer = dynamic(() => import("@/components/Common/Footer/Footer"), {
  ssr: false,
  loading: () => null,
});

const MusicPlayer = dynamic(() => import("@/components/MusicPlayer/MusicPlayer"), {
  ssr: false,
  loading: () => null,
});

/**
 * 前台客户端壳组件
 *
 * 保留页面过渡遮罩、页脚与音乐播放器。
 *
 * @returns 客户端壳节点
 */
const ClientShell = () => {
  return (
    <>
      <AppRouteTransitionOverlay />
      <Footer />
      <MusicPlayer />
    </>
  );
};

export default ClientShell;