import Image from "next/image";
import { siteConfig } from "@/siteConfig";

export default function IdentityPanel() {
  return (
    <div className="flex w-full justify-center lg:justify-start">
      <Image
        src={siteConfig.avatarUrl}
        alt={`${siteConfig.authorName} 的头像`}
        width={240}
        height={240}
        priority
        sizes="(min-width: 1536px) 180px, (min-width: 640px) 160px, 144px"
        className="aspect-square w-[144px] max-w-full rounded-[20px] object-cover shadow-[0_18px_44px_rgba(4,15,22,0.25)] ring-1 ring-white/20 sm:w-[160px] 2xl:w-[180px]"
      />
    </div>
  );
}
