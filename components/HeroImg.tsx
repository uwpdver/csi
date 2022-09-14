import Image from "next/image";

const HeroImg = () => {
  return (
    <div className="relative w-full aspect-square mt-8">
      <Image
        src="/images/hero.png"
        className=""
        layout="fill"
        alt=""
        objectFit="contain"
      />
    </div>
  );
};

export default HeroImg;
