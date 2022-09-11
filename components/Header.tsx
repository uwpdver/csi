import React from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
}

const Header = ({ children, className = "" }: Props) => {
  return <header className={`text-3xl pt-4 ${className}`}>{children}</header>;
};

export default Header;
