import Profile from "@/components/Profile/Profile";

/**
 * 首页
 * 
 * 包含 Profile 组件和 Footer 组件（Footer 已在 Layout 中全局引入，此处不再重复引入）
 */
export default function Home() {
  return (
    <>
      <Profile />
    </>
  );
}
