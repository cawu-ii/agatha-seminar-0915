"use client";

const TITLE = "製造業 AI 商用實戰論壇";
const LOCATION = "台北・華南銀行國際會議中心";
const DETAILS = "湧現智庫 Agatha 主辦。本論壇採資格審核制，審核結果將另行以 Email 通知。";
// 2026-09-15 13:30-16:30 Asia/Taipei (UTC+8) expressed in UTC for the calendar payloads.
const START_UTC = "20260915T053000Z";
const END_UTC = "20260915T083000Z";

function buildGoogleCalendarUrl(): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: TITLE,
    dates: `${START_UTC}/${END_UTC}`,
    details: DETAILS,
    location: LOCATION,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcs(): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agatha//Seminar0915//ZH-TW",
    "BEGIN:VEVENT",
    `UID:agatha-seminar-0915@emergence.today`,
    `DTSTAMP:${START_UTC}`,
    `DTSTART:${START_UTC}`,
    `DTEND:${END_UTC}`,
    `SUMMARY:${TITLE}`,
    `LOCATION:${LOCATION}`,
    `DESCRIPTION:${DETAILS}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadIcs() {
  const blob = new Blob([buildIcs()], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "agatha-seminar-0915.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function AddToCalendar() {
  return (
    <div className="thanks__actions">
      <a className="btn btn--primary" href={buildGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer">
        加入 Google 日曆
      </a>
      <button type="button" className="btn btn--ghost" onClick={downloadIcs}>
        下載 .ics（Outlook / Apple 日曆）
      </button>
    </div>
  );
}
