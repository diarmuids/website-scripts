// Last updated: 2026-09-12 15:58:40

(() => {
  const terms = [
    "uunread",
    "#aaaaall",
    ":aaaall",
    "sssssssent",
    "mailman",
    "diadrmmmmuid",
    "sssssextffon",
  ];
  const redirectUrl = "https://mail.google.com/";
  let urlChecksEnabled = false;

  function containsBannedTerm(value) {
    const normalized = String(value || "").toLowerCase();
    return terms.some((term) => normalized.includes(term));
  }

  function currentUrlContainsBannedTerm() {
    const url = window.location.href.toLowerCase();
    let decodedUrl = url;

    try {
      decodedUrl = decodeURIComponent(url);
    } catch (_) {}

    return containsBannedTerm(url) || containsBannedTerm(decodedUrl);
  }

  function redirectToGmail() {
    if (window.location.href !== redirectUrl) {
      window.location.href = redirectUrl;
    }
  }

  function findSearchInput() {
    return (
      document.querySelector("[role='presentation'] input[type='text']") ||
      document.querySelector("input[placeholder='Search mail']") ||
      document.querySelector("input[aria-label='Search mail']")
    );
  }

  function updateNavigationClasses() {
    document
      .querySelectorAll("[role*='navigation']")
      .forEach((element) => element.classList.add("main-menu"));

    document.querySelectorAll("span[role='heading']").forEach((heading) => {
      if (heading.textContent.trim() !== "Labels") return;
      const labels = heading.parentElement?.nextElementSibling;
      if (labels) labels.classList.add("labels");
    });
  }

  document.body.addEventListener("keyup", () => {
    const searchInput = findSearchInput();
    if (searchInput && containsBannedTerm(searchInput.value)) {
      redirectToGmail();
    }
  });

  updateNavigationClasses();
  new MutationObserver(updateNavigationClasses).observe(document.body, {
    childList: true,
    subtree: true,
  });

  setTimeout(() => {
    urlChecksEnabled = true;
  }, 3000);

  setInterval(() => {
    if (
      urlChecksEnabled &&
      window.location.hostname !== "accounts.google.com" &&
      currentUrlContainsBannedTerm()
    ) {
      redirectToGmail();
    }
  }, 100);
})();
