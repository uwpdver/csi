import React, { ReactElement, ReactNode } from "react";
import { useWindowSize } from "@/utils/useWindowSize";

interface Props {
  children: ReactNode;
}

const Layout = ({ children }: Props) => {
  const { height: windowHeight } = useWindowSize();

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: windowHeight }}
    >
      {children}
    </div>
  );
};

export function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
}

export default Layout;
