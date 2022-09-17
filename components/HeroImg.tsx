import Image from "next/image";

interface Props {
  className?: string;
}

const HeroImg = ({ className = "" }: Props) => {
  return (
    <div className={`relative aspect-square mt-8 shrink-0 ${className}`}>
      <Image
        src="/images/hero.png"
        className=""
        layout="fill"
        alt=""
        objectFit="contain"
        priority={false}
      />
    </div>
  );
};

export default HeroImg;
