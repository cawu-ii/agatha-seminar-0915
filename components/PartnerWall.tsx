"use client";

import { useEffect, useState } from "react";

// Data now comes from the Partner Prisma model (openspec: add-content-cms),
// passed down from the server component - PartnerWall stays "use client"
// because it needs useState for the logo-click modal, so it can't query
// Prisma itself. `img` can be null (openspec: add-speaker-partner-upload) -
// logos are now uploaded, not pasted, so a newly-created partner has none
// until someone uploads one.
interface Partner {
  id: string;
  name: string;
  desc: string;
  img: string | null;
}

export function PartnerWall({ partners }: { partners: Partner[] }) {
  const [active, setActive] = useState<Partner | null>(null);

  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActive(null);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active]);

  return (
    <>
      <div className="pwall">
        {/* Partners with no logo uploaded yet are skipped, not rendered as a
            broken image - matches the empty-state-is-legal philosophy used
            elsewhere in this project's CMS screens. */}
        {partners
          .filter((p) => p.img)
          .map((p) => (
            <button key={p.id} className="pcard" type="button" onClick={() => setActive(p)}>
              <img src={p.img!} alt={p.name} loading="lazy" />
              <span className="pcard__more">查看介紹</span>
            </button>
          ))}
      </div>

      {active && active.img && (
        <div className="pmodal" role="presentation">
          <div className="pmodal__ov" onClick={() => setActive(null)} />
          <div className="glass pmodal__box" role="dialog" aria-modal="true" aria-labelledby="pmodal-name">
            <button className="pmodal__x" aria-label="關閉" onClick={() => setActive(null)}>
              ×
            </button>
            <div className="pmodal__logo">
              <img src={active.img} alt={active.name} />
            </div>
            <h3 className="pmodal__name" id="pmodal-name">
              {active.name}
            </h3>
            <p className="pmodal__desc">{active.desc}</p>
          </div>
        </div>
      )}
    </>
  );
}
