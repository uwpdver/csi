import React from "react";
import classnames from "classnames";

interface Props {
  className?: string;
  selectedClassName?: string;
  weight: number;
  onClick?(e: React.MouseEvent): void;
  isSelected?: boolean;
}

const Option = ({
  className = "",
  selectedClassName = "",
  weight,
  onClick,
  isSelected = false,
}: Props) => {
  return (
    <li
      onClick={onClick}
      className={classnames(
        "bg-red-600 h-10 w-10 rounded-full flex items-center justify-center font-bold text-xl text-white leading-10 align-middle",
        className,
        {
          [`bg-red-300 ${selectedClassName}`]: isSelected,
        }
      )}
    >
      {weight}
    </li>
  );
};

export default Option;
