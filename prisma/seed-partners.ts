// One-time seed for the partner content that used to be hardcoded in
// components/PartnerWall.tsx. Run manually once when the Partner table is
// empty (see README) - not wired into migrate/build so it can't accidentally
// re-run and duplicate rows on a second deploy.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PARTNERS: Array<{ name: string; description: string; logoUrl: string }> = [
  {
    name: "今晧實業",
    logoUrl: "/images/asset-9ea1ca600b.png",
    description:
      "從 40 年連接線產品起家，如今致力於為企業開發與提供創新解決方案；今晧將從自身經驗出發，分享如何從傳統製造業佈局 AI 軟硬體生態系，建構從地端算力 LPU 到雲端 SaaS 的 Total Solution。",
  },
  {
    name: "金屬工業研究發展中心",
    logoUrl: "/images/asset-ee461bf2f8.png",
    description:
      "金屬中心（財團法人金屬工業研究發展中心，MIRDC）為經濟部所屬非營利研究法人，長期從事金屬及相關製造工業的生產與管理技術研發與推廣，協助國內製造業升級。近年建置 AI 試產線與人才培訓服務，推動智慧製造、機器視覺與智慧銲接等技術導入，並提供檢測驗證、製程輔導與產業轉型諮詢，是製造業導入 AI 與運用政府輔導資源的重要夥伴。",
  },
  {
    name: "AIFT",
    logoUrl: "/images/asset-9d6c7433a1.png",
    description:
      "AIFT 為國際 AI 安全與風險管理科技公司，專注於生成式 AI 安全、模型風險評估與 AI 治理解決方案，核心產品 Vulcan AI 安全平台提供 AI 紅隊演練與即時防護能力，目前已在多家金融及高科技製造業採用其產品及服務。公司在亞洲，包括台灣與中東等區域皆設有據點與在地團隊，致力協助企業安全導入生成式 AI 與 AI Agent，並已取得 ISO 27001 與 ISO 27017 認證。",
  },
  {
    name: "資策會",
    logoUrl: "/images/asset-2f42dd1559.png",
    description:
      "資策會（財團法人資訊工業策進會，III）以「數位轉型的化育者」為定位，肩負賦能產業轉型與健全產業秩序的任務，並以數位經濟、軟體技術、數位轉型、資安產業為四大主軸。長期擔任產業智庫，提供前瞻研發、場域實證與人才培育，並推動「人工智慧島」等計畫，協助製造等產業建構 AI 應用場景與生態系，從產業推動視角觀察製造業的 AI 導入與資源佈局。",
  },
  {
    name: "優達科技 UfiSpace",
    logoUrl: "/images/asset-ccec0bcd8c.png",
    description:
      "優達科技（UfiSpace）為新一代開放式網路架構解決方案的推動者（Enabler），提供彈性、開放、智慧化且具價格競爭力的網通產品，於 5G、6G 時代皆能成為產業先行者，並以開放網路基礎建設，支撐 AI 時代所需的算力調度與資料流動。",
  },
  {
    name: "輔信科技 Shuttle",
    logoUrl: "/images/asset-d68f66665e.png",
    description:
      "輔信科技（Shuttle）專注於軟硬整合與物聯網應用開發，方案涵蓋迷你電腦、數位看板、人臉辨識、KIOSK、工業電腦、Panel PC 與客製化 IoT 整合設計，可作為製造現場 AI 應用佈署的邊緣運算與硬體整合夥伴。",
  },
  {
    name: "聚上雲 EpicCloud",
    logoUrl: "/images/asset-620f63c028.png",
    description:
      "聚上雲致力以雲端驅動企業數位創新，以 monday.com 為核心，專精於企業核心應用、雲端可靠性託管維運、資訊安全管控、專案軟體開發四大領域，並結合三大公有雲服務，為企業導入 AI 打造韌性營運與資安基底。",
  },
  {
    name: "銓鍇國際 CKmates",
    logoUrl: "/images/asset-520d0e2d7c.png",
    description:
      "銓鍇國際 CKmates，專注雲端與地端整合服務，協助企業打造兼顧彈性、成本與治理的混合雲架構。團隊由資深顧問與工程師組成，服務涵蓋雲端遷移、架構優化、代管維運，以及弱點掃描、滲透測試與威脅偵測應變，並以 7x24 監控確保系統穩定與合規。曾參與製造、金融、電商等產業，協助客戶強化資安防護、提升營運效率。",
  },
];

async function main() {
  const existing = await prisma.partner.count();
  if (existing > 0) {
    console.log(`Partner already has ${existing} row(s) - skipping seed to avoid duplicates.`);
    return;
  }

  for (let i = 0; i < PARTNERS.length; i++) {
    const partner = PARTNERS[i];
    await prisma.partner.create({
      data: { ...partner, sortOrder: (i + 1) * 10 },
    });
  }
  console.log(`Seeded ${PARTNERS.length} partners.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
