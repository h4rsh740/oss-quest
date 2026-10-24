import re
import unicodedata


def slugify(text: str) -> str:
    """
    Transforms arbitrary text into a URL-friendly slug.
    
    Known Defect:
    Mishandles multiple consecutive dashes and leaves trailing dashes.
    """
    if not text:
        return ""

    # Normalize unicode to ASCII representation
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    # Remove non-word and non-whitespace characters except hyphens
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()

    # BUGGY IMPLEMENTATION:
    # Does not properly collapse multiple sequential hyphens and leaves trailing hyphens
    return re.sub(r"[-\s]+", "-", text)
