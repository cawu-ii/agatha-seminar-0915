"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormOptionsByField } from "@/lib/registration-schema";
import { readStoredUtmParams, readUtmFromLocation, storeUtmParams } from "@/lib/utm";

// Option values are admin-editable (openspec: add-form-options-cms) and
// queried server-side in app/seminar/0915/page.tsx, then passed down here -
// this component no longer imports the static lib/form-options.ts constants.
export function RegistrationForm({ options }: { options: FormOptionsByField }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [sessionsError, setSessionsError] = useState(false);
  const [consultError, setConsultError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
    const utm = readUtmFromLocation();
    storeUtmParams(utm);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    const form = formRef.current;
    if (!form || !idempotencyKey) return;

    const fd = new FormData(form);
    const sessions = fd.getAll("sessions") as string[];
    const consult = fd.getAll("consult") as string[];

    const hasSessions = sessions.length > 0;
    const hasConsult = consult.length > 0;
    setSessionsError(!hasSessions);
    setConsultError(!hasConsult);

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (!hasSessions || !hasConsult) {
      document.querySelector(".frow--err")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const utm = readStoredUtmParams();

    const payload = {
      idempotencyKey,
      name: fd.get("name"),
      company: fd.get("company"),
      taxId: fd.get("taxid"),
      dept: fd.get("dept"),
      deptOther: fd.get("dept_other") || "",
      title: fd.get("title"),
      titleOther: fd.get("title_other") || "",
      industry: fd.get("industry"),
      industryOther: fd.get("industry_other") || "",
      size: fd.get("size"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      sessions,
      stage: fd.get("stage"),
      stageOther: fd.get("stage_other") || "",
      consult,
      consultOther: fd.get("consult_other") || "",
      agreeTerms: fd.get("agree_terms") === "on",
      agreeMarketing: fd.get("agree_marketing") === "on",
      ...utm,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setSubmitError("送出失敗，請確認填寫內容後再試一次，或來信 service@emergence.today。");
        setSubmitting(false);
        return;
      }
      const data = (await res.json()) as { event_id: string };
      const qs = new URLSearchParams({
        eid: data.event_id,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        utm_content: utm.utm_content,
      });
      router.push(`/seminar/0915/thanks?${qs.toString()}`);
    } catch {
      setSubmitError("網路連線異常，請稍後再試一次。");
      setSubmitting(false);
    }
  }

  return (
    <form className="regform" id="regform" noValidate ref={formRef} onSubmit={handleSubmit}>
      <div className="frow">
        <label className="flabel">
          姓名<span className="req">*</span>
        </label>
        <input className="finput" type="text" name="name" placeholder="王小明" required />
      </div>
      <div className="frow">
        <label className="flabel">
          公司名稱<span className="req">*</span>
        </label>
        <input className="finput" type="text" name="company" placeholder="湧現智庫股份有限公司" required />
      </div>
      <div className="frow">
        <label className="flabel">
          公司統編<span className="req">*</span>
        </label>
        <input className="finput" type="text" name="taxid" placeholder="12345678" required />
      </div>

      <div className="frow">
        <label className="flabel">
          所屬部門<span className="req">*</span>
        </label>
        <div className="opts opts--radio">
          {options.dept.map((opt) => (
            <label className="opt" key={opt}>
              <input type="radio" name="dept" value={opt} required={opt === options.dept[0]} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        <input className="finput fother--sel" type="text" name="dept_other" placeholder="若選「其他」，請於此填寫" />
      </div>

      <div className="frow">
        <label className="flabel">
          職稱<span className="req">*</span>
        </label>
        <select className="finput fselect" name="title" required defaultValue="">
          <option value="" disabled>
            請選擇
          </option>
          {options.title.map((opt) => (
            <option value={opt} key={opt}>
              {opt}
            </option>
          ))}
        </select>
        <input className="finput fother fother--sel" type="text" name="title_other" placeholder="若選「其他」，請於此填寫" />
      </div>

      <div className="frow">
        <label className="flabel">
          所屬產業<span className="req">*</span>
        </label>
        <div className="opts opts--radio">
          {options.industry.map((opt) => (
            <label className="opt" key={opt}>
              <input type="radio" name="industry" value={opt} required={opt === options.industry[0]} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        <input className="finput fother--sel" type="text" name="industry_other" placeholder="若選「其他」，請於此填寫" />
      </div>

      <div className="frow">
        <label className="flabel">
          公司規模<span className="req">*</span>
        </label>
        <select className="finput fselect" name="size" required defaultValue="">
          <option value="" disabled>
            請選擇
          </option>
          {options.size.map((opt) => (
            <option value={opt} key={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className="frow">
        <label className="flabel">
          商務 Email<span className="req">*</span>
        </label>
        <p className="fhelp">請填寫公司專用信箱，以利審核通過並收取詳細活動資訊。</p>
        <input className="finput" type="email" name="email" placeholder="name@company.com" required />
      </div>

      <div className="frow">
        <label className="flabel">
          聯絡電話<span className="req">*</span>
        </label>
        <input className="finput" type="tel" name="phone" placeholder="09xx-xxx-xxx" required />
      </div>

      <div className={`frow${sessionsError ? " frow--err" : ""}`}>
        <label className="flabel">
          您最感興趣的論壇議程（可複選）<span className="req">*</span>
        </label>
        <div className="opts">
          {options.sessions.map((opt) => (
            <label className="opt" key={opt}>
              <input type="checkbox" name="sessions" value={opt} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="frow">
        <label className="flabel">
          貴公司目前 AI 導入階段為何？<span className="req">*</span>
        </label>
        <div className="opts opts--radio">
          {options.stage.map((opt) => (
            <label className="opt" key={opt}>
              <input type="radio" name="stage" value={opt} required={opt === options.stage[0]} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        <input className="finput fother--sel" type="text" name="stage_other" placeholder="若選「其他」，請於此填寫" />
      </div>

      <div className={`frow${consultError ? " frow--err" : ""}`}>
        <label className="flabel">
          您希望現場諮詢的議題（可複選）<span className="req">*</span>
        </label>
        <div className="opts">
          {options.consult.map((opt) => (
            <label className="opt" key={opt}>
              <input type="checkbox" name="consult" value={opt} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        <input className="finput fother--sel" type="text" name="consult_other" placeholder="若選「其他」，請於此填寫" />
      </div>

      <div className="frow consent">
        <label className="opt opt--consent">
          <input type="checkbox" name="agree_terms" required />
          <span>
            本人同意湧現智庫及其合作夥伴，得將本次活動蒐集之個人資料，用於活動聯繫、活動審核及後續產業資訊交流。<span className="req">*</span>
          </span>
        </label>
      </div>

      <div className="notice">
        <p className="notice__star">＊本論壇採「審核制」，主辦單位保留審核之最終決定權；報名送出後，將以 Email 通知審核結果。</p>
        <p className="notice__h">◎ 活動注意事項</p>
        <ul>
          <li>主辦單位保留隨時修改或終止本活動之權利；如有異動或相關事項，將公布於本頁面或以報名 Email 通知，恕不另行個別告知。</li>
          <li>
            本活動採審核制，通過者將另以 Email 通知；如有任何問題，歡迎來信{" "}
            <a href="mailto:service@emergence.today">service@emergence.today</a>。
          </li>
        </ul>
        <p className="notice__p">
          湧現智庫重視並尊重你的隱私。我們僅會將你的個人資料用於管理你的帳戶，以及提供你所要求的產品與服務；並希望能不定期與你分享我們的產品、服務及你可能感興趣的內容。若你同意我們基於上述目的與你聯繫，請於下方勾選你希望的聯繫方式：
        </p>
        <label className="opt opt--consent">
          <input type="checkbox" name="agree_marketing" />
          <span>我同意收取來自 Agatha｜湧現智庫 的其他通訊。</span>
        </label>
        <p className="notice__fine">
          你可以隨時取消訂閱這些通訊。若想進一步了解如何取消訂閱、我們的隱私處理方式，以及我們如何保護並尊重你的隱私，請參閱我們的《隱私權政策》。在下方按一下「送出」，即表示你同意
          Agatha｜湧現智庫 儲存並處理你於上方提交的個人資料，以提供你所要求的內容。
        </p>
      </div>

      {submitError && <p className="admin__error">{submitError}</p>}

      <button className="btn btn--primary regsubmit" type="submit" disabled={submitting || !idempotencyKey}>
        {submitting ? "送出中…" : "送出報名申請"}
      </button>
    </form>
  );
}
