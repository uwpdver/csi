import React from "react";
import classnames from "classnames";

interface Props {
  nickname?: string;
  className?: string;
}

const Avatar = ({ nickname = "", className = "" }: Props) => {
  return (
    <div
      className={classnames(
        "",
        "h-10 w-10 mr-2 bg-gray-100 border border-gray-600 rounded-full flex items-center justify-center",
        className
      )}
    >
      {nickname?.slice(0, 1)}
    </div>
  );
};

export default Avatar;
