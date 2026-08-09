from litellm import completion

from app.document_types.spec import DocumentTypeSpec
from app.models.translation import TranslatedDocument
from app.models.ui_strings import UiStrings
from app.services.chat_service import EXTRA_BODY, MODEL, LlmCallError

# In-memory cache: (slug, language) -> TranslatedDocument. There's no
# persistence layer yet, so this is simply lost on every process restart —
# consistent with the rest of the app's "no persistence" state.
_TRANSLATION_CACHE: dict[tuple[str, str], TranslatedDocument] = {}


def _translation_prompt(spec: DocumentTypeSpec, language: str) -> str:
    field_lines = "\n".join(f"- key={f.key!r}: {f.label!r}" for f in spec.fields)
    clause_lines = "\n".join(f"- number={c.number!r}: {c.text!r}" for c in spec.clauses)
    ui_lines = "\n".join(f"- {key}: {value!r}" for key, value in UiStrings().model_dump().items())
    return f"""Translate the following legal document type into the language with ISO 639-1 \
code "{language}". Preserve every `{{{{field_key}}}}` placeholder in clause text EXACTLY as-is \
(do not translate or remove the placeholder syntax itself, only the surrounding prose). Keep \
each field's `key` and each clause's `number` unchanged; only translate `label`/`text`. Return \
exactly the same number of fields and clauses, in the same order, and exactly the same number \
of party roles, in the same order (only translate each role's name).

Document name: {spec.name!r}
Document description: {spec.description!r}
Party roles: {list(spec.party_roles)!r}

Fields:
{field_lines}

Clauses:
{clause_lines}

Also translate this fixed set of UI strings (keep the same keys, translate only the values):
{ui_lines}

Finally, write a one-sentence `translationDisclaimer` in the target language explaining that \
this is an unofficial machine translation and the English original is the legally authoritative \
version."""


def get_translated_document(spec: DocumentTypeSpec, language: str) -> TranslatedDocument:
    cache_key = (spec.slug, language)
    if cache_key in _TRANSLATION_CACHE:
        return _TRANSLATION_CACHE[cache_key]

    try:
        response = completion(
            model=MODEL,
            messages=[{"role": "system", "content": _translation_prompt(spec, language)}],
            response_format=TranslatedDocument,
            reasoning_effort="low",
            extra_body=EXTRA_BODY,
        )
        translated = TranslatedDocument.model_validate_json(response.choices[0].message.content)
    except Exception as exc:
        raise LlmCallError(f"Failed to translate document into {language!r}") from exc

    _TRANSLATION_CACHE[cache_key] = translated
    return translated
