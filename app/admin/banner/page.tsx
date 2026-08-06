import { BannerUploader } from "@/components/BannerUploader";
import { LogoutButton } from "@/components/LogoutButton";

export default function AdminBannerPage() {
  return (
    <div className="admin">
      <div className="admin__head">
        <div>
          <h1 style={{ color: "#14231b", fontSize: 24 }}>Banner 管理</h1>
          <p style={{ color: "#5f7268", fontSize: 13 }}>
            上傳落地頁 Hero 主視覺（桌機版／手機版），儲存後下次載入落地頁即會反映。上傳完成後請直接開啟正式站確認顯示效果。
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a className="btn btn--ghost" href="/admin">
            回報名後台
          </a>
          <LogoutButton />
        </div>
      </div>
      <BannerUploader />
    </div>
  );
}
