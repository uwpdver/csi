import React from "react";

interface Props {
  children?: React.ReactNode;
  title?: string;
  className?: string;
}

const Header = ({ children, title = "", className = "" }: Props) => {
  return (
    <header className={`flex items-end pt-4 ${className}`}>
      <div className="text-3xl flex-1">{title}</div>
      <div>{children}</div>
    </header>
  );
};

export default Header;
