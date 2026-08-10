import { Fragment, type ReactNode } from "react";

// Tiny explicit **bold** markup subset for admin-editable copy (openspec:
// add-intro-copy-cms design.md) - not a general Markdown parser. An odd/
// unmatched ** renders as literal asterisks (the regex simply won't match
// it), never silently dropped.
export function renderWithBold(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>));
}
