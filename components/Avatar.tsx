import React from "react";
import classnames from "classnames";

type Size = "sm" | "md" | "lg";

interface Props {
  nickname?: string;
  className?: string;
  size?: Size;
}

const SizeMap = {
  sm: "w-4 h-4",
  md: "w-10 h-10",
  lg: "w-16 h-16 text-2xl",
};

const Avatar = ({ nickname = "", className = "", size = "md" }: Props) => {
  return (
    <div
      className={classnames(
        SizeMap[size],
        "bg-gray-500 rounded-full flex items-center justify-center",
        className
      )}
    >
      {nickname?.slice(0, 1)}
    </div>
  );
};

export default Avatar;
