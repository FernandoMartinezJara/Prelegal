export interface UiStrings {
  subtitle: string;
  emptyStatePlaceholder: string;
  schemaLoadError: string;
  chatGreeting: string;
  chatThinking: string;
  chatError: string;
  retry: string;
  send: string;
  messageLabel: string;
  downloadPdf: string;
  generatingPdf: string;
  signingNote: string;
  signatureLabel: string;
  printNameLabel: string;
  titleLabel: string;
  companyLabel: string;
  noticeAddressLabel: string;
  dateLabel: string;
  termFixedLabel: string;
  termOpenEndedLabel: string;
  previewFooter: string;
}

// English defaults — shown before any document type (and therefore
// language) has been resolved, and as the fallback for any key a
// translation call happens to omit.
export const DEFAULT_UI_STRINGS: UiStrings = {
  subtitle: "Tell the assistant what agreement you need, then review and download it below.",
  emptyStatePlaceholder: "Describe the agreement you need in the chat to get started.",
  schemaLoadError: "Couldn't load that document type. Please try again.",
  chatGreeting: "Hi! What kind of legal document are you looking to put together today?",
  chatThinking: "Assistant is thinking…",
  chatError: "Something went wrong reaching the assistant. Please try again.",
  retry: "Retry",
  send: "Send",
  messageLabel: "Message",
  downloadPdf: "Download PDF",
  generatingPdf: "Generating PDF…",
  signingNote: "By signing below, each party agrees to enter into this agreement.",
  signatureLabel: "Signature",
  printNameLabel: "Print Name",
  titleLabel: "Title",
  companyLabel: "Company",
  noticeAddressLabel: "Notice Address",
  dateLabel: "Date",
  termFixedLabel: "Expires",
  termOpenEndedLabel: "Continues until terminated",
  previewFooter: "Based on a Common Paper standard-terms template. Review with counsel before use.",
};
