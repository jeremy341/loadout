"use client";

import Image from "next/image";
import "../hero-workshop-background.css";

const assetRoot = "/loadout/hero-workshop";

const decorations = [
  ["slashes-large.png",685,217],
  ["slashes-medium.png",392,146],
  ["slashes-small.png",262,115],
  ["plus-large.png",221,218],
  ["plus-medium.png",167,165],
  ["plus-small.png",119,121],
  ["plus-tiny.png",96,104],
  ["yellow-pixels-small.png",248,134],
  ["yellow-pixels-medium.png",304,133],
  ["yellow-pixels-large.png",371,139],
  ["grey-pixels-small.png",244,116],
  ["grey-pixels-medium.png",302,114],
  ["grey-pixels-large.png",377,117],
] as const;

export function HeroWorkshopBackground() {
  return <div className="hero-workshop-background" aria-hidden="true">
    <div className="hero-workshop-scenery">
      <Image unoptimized width={384} height={128} className="hero-workshop-skyline" src={`${assetRoot}/skyline.png`} alt="" draggable={false} />
      <Image unoptimized width={160} height={200} className="hero-workshop-left-structure" src={`${assetRoot}/left-structure.png`} alt="" draggable={false} />
      <Image unoptimized width={160} height={200} className="hero-workshop-right-structure" src={`${assetRoot}/right-structure.png`} alt="" draggable={false} />
      <div className="hero-workshop-air">
        {decorations.map(([file,width,height], index) => <Image unoptimized width={width} height={height}
          className={`hero-workshop-decoration hero-workshop-decoration-${index + 1}`}
          src={`${assetRoot}/${file}`}
          alt=""
          draggable={false}
          key={file}
        />)}
      </div>
    </div>
    <Image unoptimized width={240} height={192} className="hero-workshop-left-workbench" src={`${assetRoot}/left-workbench.png`} alt="" draggable={false} />
    <Image unoptimized width={240} height={192} className="hero-workshop-right-workstation" src={`${assetRoot}/right-workstation.png`} alt="" draggable={false} />
    <div className="hero-workshop-platform" />
  </div>;
}
