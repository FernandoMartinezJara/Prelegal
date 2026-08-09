from app.models.common import CamelModel


class UiStrings(CamelModel):
    """Fixed set of the app's own UI copy (buttons, placeholders, labels).
    English defaults here are the fallback shown before any document type
    (and therefore language) has been resolved."""

    subtitle: str = "Tell the assistant what agreement you need, then review and download it below."
    empty_state_placeholder: str = "Describe the agreement you need in the chat to get started."
    schema_load_error: str = "Couldn't load that document type. Please try again."
    chat_greeting: str = "Hi! What kind of legal document are you looking to put together today?"
    chat_thinking: str = "Assistant is thinking…"
    chat_error: str = "Something went wrong reaching the assistant. Please try again."
    retry: str = "Retry"
    send: str = "Send"
    message_label: str = "Message"
    download_pdf: str = "Download PDF"
    generating_pdf: str = "Generating PDF…"
    signing_note: str = "By signing below, each party agrees to enter into this agreement."
    signature_label: str = "Signature"
    print_name_label: str = "Print Name"
    title_label: str = "Title"
    company_label: str = "Company"
    notice_address_label: str = "Notice Address"
    date_label: str = "Date"
    term_fixed_label: str = "Expires"
    term_open_ended_label: str = "Continues until terminated"
    preview_footer: str = "Based on a Common Paper standard-terms template. Review with counsel before use."
