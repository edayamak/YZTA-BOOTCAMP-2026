(function () {
  const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const PHONE_PATTERN =
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{2}[\s.-]?\d{2,4}/g;
  const CARD_PATTERN = /\b(?:\d[ -]*?){13,19}\b/g;
  const TC_KIMLIK_PATTERN = /\b[1-9]\d{10}\b/g;

  const SENSITIVE_INPUT_TYPES = new Set([
    "password",
    "email",
    "tel",
    "hidden"
  ]);

  const SENSITIVE_NAME_KEYWORDS = [
    "email",
    "e-mail",
    "mail",
    "phone",
    "telefon",
    "tel",
    "password",
    "sifre",
    "şifre",
    "credit",
    "card",
    "kart",
    "cvv",
    "cvc",
    "ssn",
    "tc",
    "kimlik",
    "address",
    "adres",
    "street",
    "sokak",
    "cadde",
    "postal",
    "zip",
    "firstname",
    "lastname",
    "first-name",
    "last-name",
    "full-name",
    "fullname",
    "ad",
    "soyad",
    "isim",
    "name"
  ];

  function isSensitiveField(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;

    const type = (el.getAttribute("type") || "").toLowerCase();
    if (SENSITIVE_INPUT_TYPES.has(type)) return true;

    const haystack = [
      el.getAttribute("name") || "",
      el.getAttribute("id") || "",
      el.getAttribute("autocomplete") || "",
      el.getAttribute("placeholder") || "",
      el.getAttribute("aria-label") || "",
      el.className ? String(el.className) : ""
    ]
      .join(" ")
      .toLowerCase();

    return SENSITIVE_NAME_KEYWORDS.some((keyword) => haystack.includes(keyword));
  }

  function redactText(text) {
    if (!text) return text;

    return String(text)
      .replace(EMAIL_PATTERN, "[REDACTED_EMAIL]")
      .replace(CARD_PATTERN, "[REDACTED_CARD]")
      .replace(TC_KIMLIK_PATTERN, "[REDACTED_ID]")
      .replace(PHONE_PATTERN, "[REDACTED_PHONE]");
  }

  function sanitizeUrl(url) {
    if (!url) return url;

    try {
      const parsed = new URL(url);
      const sensitiveParams = [
        "token",
        "session",
        "auth",
        "key",
        "email",
        "phone",
        "password",
        "code",
        "otp"
      ];

      sensitiveParams.forEach((param) => parsed.searchParams.delete(param));
      return parsed.toString();
    } catch {
      return redactText(url);
    }
  }

  function sanitizeCloneNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent = redactText(node.textContent);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    if (node.tagName === "INPUT" || node.tagName === "TEXTAREA" || node.tagName === "SELECT") {
      node.removeAttribute("value");
      if (isSensitiveField(node)) {
        node.setAttribute("value", "[REDACTED]");
        node.textContent = "";
      }
    }

    for (const attr of ["data-user", "data-customer", "data-email", "data-phone"]) {
      if (node.hasAttribute(attr)) {
        node.setAttribute(attr, "[REDACTED]");
      }
    }

    for (const child of node.childNodes) {
      sanitizeCloneNode(child);
    }
  }

  window.KonseyPiiSanitizer = {
    isSensitiveField,
    redactText,
    sanitizeUrl,
    sanitizeCloneNode
  };
})();
