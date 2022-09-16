import React from "react";
import ReactModal from "react-modal";
import { PlayerInClient } from "@/types/client";
import { Role } from "@/types/index";

const MatchesWelcomeModal = ({
  isOpen = false,
  self,
  onOKBtnClick = () => {},
}: {
  isOpen: boolean;
  self?: PlayerInClient;
  onOKBtnClick?(): void;
}) => {
  const contentRender = () => {
    switch (self?.role) {
      case Role.Witness:
        return (
          <article className="font-serif flex flex-col">
            <div className="flex-1 space-y-1">
              <p className="">{`亲爱的${self?.user.name ?? "无名"}`}</p>
              <p className="indent-8">你好！</p>
              <p className="indent-8">如你所见，我们这里刚发生了一些可怕的事情，据我们调查得知只有你看见了【凶手】行凶的过程，希望你能把你知道的有关凶手的信息尽可能都告诉我们，协助我们抓出凶手。我们的【侦探】也会倾力配合。</p>
              <p className="indent-8">在凶手行凶之后，你会知道凶手选择的【作案手法】和【线索】，你只能通过将【选项物】放置在场上的【信息卡】上的方式来提示在场的侦探们，让侦探能找出凶手的【作案手法】和【线索】。你提供的信息将很大程度上决定我们能否将凶手抓获！</p>
              <p className="indent-8">祝:身体安康！</p>
              <p className="text-right">你远方的朋友</p>
              <p className="text-right">
                {new Date().toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <button className="mt-4" onClick={onOKBtnClick}>
              知道了
            </button>
          </article>
        );
      case Role.Murderer:
        return (
          <article className="font-serif flex flex-col">
            <header className="mb-4">
              <span>
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="float-right">大雨</span>
            </header>
            <div className="flex-1 space-y-1">
              <p className="indent-8">怎么办！怎么办！怎么办！冷静！冷静！冷静！千万要冷静！</p>
              <p className="indent-8">人已经死了，我不能让他们知道是我干的，可恶！刚才好像被人看见了，那些【侦探】来的真快，根本来不及跑了。干脆我也装成侦探误导他们，只要他们找不到我的【作案手法】和【线索】就不能把我怎么样。呵！只是一帮装模做样的傻瓜而已。</p>
              <p className="indent-8">我需要隐藏自己的【凶手】身份，并且表现得像一个正常的【侦探】以免被人怀疑，我必须让他们找不到我的【作案手法】和【线索】一直到三个回合结束。</p>
            </div>
            <button className="mt-4" onClick={onOKBtnClick}>
              知道了
            </button>
          </article>
        );

      default:
        return (
          <article className="font-serif flex flex-col">
            <div className="flex-1 space-y-1">
              <p className="">{`亲爱的${self?.user.name ?? "无名"}侦探`}</p>
              <p className="indent-8">你好！</p>
              <p className="indent-8">我们这里发生了一场骇人听闻的凶案，为了找出真凶我们邀请了几位【侦探】来帮助我们，而【凶手】已经悄悄地藏在在场的每一个自称“侦探”的人之中。好在我们发现了一位【目击者】，但他好像有点被吓坏了，没法正常说话。</p>
              <p className="indent-8">在场的所有侦探各自拥有不同的【作案手法】（红色卡片）和【线索】（白色卡片）。你需要根据【目击者】提供的少量信息以及在场其他侦探的推理找到凶手的【作案手法】和【线索】，来将凶手绳之以法。</p>
              <p className="indent-8">祝:身体安康！</p>
              <p className="text-right">你远方的朋友</p>
              <p className="text-right">
                {new Date().toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <button className="mt-4" onClick={onOKBtnClick}>
              知道了
            </button>
          </article>
        );
    }
  };
  return (
    <ReactModal
      isOpen={isOpen}
      style={{
        content: {
          left: 12,
          right: 12,
          bottom: "auto",
        },
      }}
    >
      {contentRender()}
    </ReactModal>
  );
};

export default MatchesWelcomeModal;
