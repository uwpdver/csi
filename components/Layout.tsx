import React, { ReactElement, ReactNode } from "react";
import { useWindowSize } from "@/utils/useWindowSize";

interface Props {
  children: ReactNode;
}

const Layout = ({ children }: Props) => {
  const { height: windowHeight } = useWindowSize();

  return (
    <div
      className="flex flex-col px-4 pb-4"
      style={{ minHeight: windowHeight }}
    >
      {children}
    </div>
  );
};

export function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
}

export default Layout;
