import React from "react";
import Image from "next/image";
import classnames from "classnames";

interface Props {
  name: string;
  className?: string;
  onClick?(): void;
  isHighlight?: boolean;
}

const HandCard = ({ name, className = "", isHighlight, onClick }: Props) => {
  return (
    <li
      className={classnames("hand-card", className, {
        "transition brightness-50": !isHighlight,
      })}
      onClick={onClick}
    >
      <div className="relative w-full aspect-square mb-2">
        <Image
          src="/images/hammer.webp"
          layout="fill"
          objectFit="contain"
          alt=""
        />
      </div>
      <div className="text-xl text-right">{name}</div>
    </li>
  );
};

export default React.memo(HandCard);
