import Link from "next/link";

interface Props {
  className?: string;
}

const SiteFooter = ({ className = "" }: Props) => {
  return (
    <div className={`text-xs space-x-2 text-gray-400 ${className}`}>
      <span>
        由
        <Link href="https://uwpdver.github.io/">
          <a className="underline">@要没时间了</a>
        </Link>
        设计和制作
      </span>
      <span>
        代码开源在
        <Link href="https://github.com/uwpdver/csi/">
          <a className="underline">GitHub</a>
        </Link>
      </span>

      <Link href="https://github.com/uwpdver/csi/issues/new">
        <a className="underline float-right">问题反馈</a>
      </Link>
    </div>
  );
};

export default SiteFooter;
