(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let revealObserver = null;
  let itemObserver = null;
  let scrollRaf = 0;

  function currentLang() {
    return window.getSiteLang();
  }

  function renderExperience(lang) {
    const root = document.getElementById("experience-list");
    const jobs = window.t("experience.jobs", lang);
    if (!root || !Array.isArray(jobs)) return;

    root.innerHTML = jobs
      .map(function (job, index) {
        const achievements =
          job.achievements && job.achievements.length
            ? "<ul class=\"job-achievements\">" +
              job.achievements
                .map(function (item) {
                  return "<li>" + escapeHtml(item) + "</li>";
                })
                .join("") +
              "</ul>"
            : "";

        return (
          "<li class=\"job motion-item\" style=\"--i: " +
          index +
          "\">" +
          "<p class=\"job-period\">" +
          escapeHtml(job.period) +
          "</p>" +
          "<h3 class=\"job-company\">" +
          escapeHtml(job.company) +
          "</h3>" +
          "<p class=\"job-role\">" +
          escapeHtml(job.role) +
          "</p>" +
          "<p class=\"job-summary\">" +
          escapeHtml(job.summary) +
          "</p>" +
          achievements +
          "</li>"
        );
      })
      .join("");
  }

  function renderSkills(lang) {
    const root = document.getElementById("skills-list");
    const groups = window.t("skills.groups", lang);
    if (!root || !Array.isArray(groups)) return;

    root.innerHTML = groups
      .map(function (group, index) {
        return (
          "<article class=\"skill-group motion-item\" style=\"--i: " +
          index +
          "\">" +
          "<h3>" +
          escapeHtml(group.name) +
          "</h3>" +
          "<ul class=\"chips\">" +
          group.items
            .map(function (item, chipIndex) {
              return (
                "<li style=\"--chip-i: " +
                chipIndex +
                "\">" +
                escapeHtml(item) +
                "</li>"
              );
            })
            .join("") +
          "</ul>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderEducation(lang) {
    const root = document.getElementById("education-list");
    const items = window.t("education.items", lang);
    if (!root || !Array.isArray(items)) return;

    root.innerHTML = items
      .map(function (item, index) {
        return (
          "<li class=\"edu-item motion-item\" style=\"--i: " +
          index +
          "\">" +
          "<span class=\"edu-school\">" +
          escapeHtml(item.school) +
          "</span>" +
          "<span class=\"edu-degree\">" +
          escapeHtml(item.degree) +
          "</span>" +
          "<span class=\"edu-period\">" +
          escapeHtml(item.period) +
          "</span>" +
          "</li>"
        );
      })
      .join("");
  }

  function applyLanguage(lang) {
    document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
    document.documentElement.dataset.lang = lang;
    try {
      localStorage.setItem("site-lang", lang);
    } catch (e) {}

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      const value = window.t(el.getAttribute("data-i18n"), lang);
      if (typeof value === "string") el.textContent = value;
    });

    const menuToggle = document.querySelector(".nav-toggle");
    if (menuToggle) {
      const open = document.body.classList.contains("nav-open");
      menuToggle.setAttribute(
        "aria-label",
        window.t(open ? "a11y.menuClose" : "a11y.menu", lang)
      );
    }

    document.querySelectorAll("[data-set-lang]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-set-lang") === lang));
    });

    const title = window.t("meta.title", lang);
    const description = window.t("meta.description", lang);
    if (title) document.title = title;

    const descEl = document.querySelector('meta[name="description"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (descEl) descEl.setAttribute("content", description);
    if (ogDesc) ogDesc.setAttribute("content", description);
    if (twitterDesc) twitterDesc.setAttribute("content", description);
    if (ogLocale) ogLocale.setAttribute("content", lang === "en" ? "en_US" : "pt_BR");

    renderExperience(lang);
    renderSkills(lang);
    renderEducation(lang);
    bindReveal();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function closeNav() {
    document.body.classList.remove("nav-open");
    const toggle = document.querySelector(".nav-toggle");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", window.t("a11y.menu"));
    }
  }

  function bindHeader() {
    const header = document.querySelector(".site-header");
    const onScroll = function () {
      if (!header) return;
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function bindNav() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("site-nav");
    if (toggle) {
      toggle.addEventListener("click", function () {
        const open = !document.body.classList.contains("nav-open");
        document.body.classList.toggle("nav-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", window.t(open ? "a11y.menuClose" : "a11y.menu"));
      });
    }
    if (nav) {
      nav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", closeNav);
      });
    }
    var logo = document.querySelector(".logo");
    if (logo) logo.addEventListener("click", closeNav);
    window.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNav();
    });
  }

  function bindLang() {
    document.querySelectorAll("[data-set-lang]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyLanguage(btn.getAttribute("data-set-lang"));
      });
    });
  }

  function bindSmoothScroll() {
    if (reduceMotion) return;
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (event) {
        const id = link.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function showAllMotion() {
    document.querySelectorAll(".reveal, .reveal-child, .motion-item").forEach(function (node) {
      node.classList.add("is-visible");
    });
    document.documentElement.classList.add("hero-ready");
    document.documentElement.style.setProperty("--scroll-progress", "0");
    document.documentElement.style.setProperty("--timeline-progress", "1");
    document.documentElement.style.setProperty("--parallax-y", "0px");
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function updateScrollMotion() {
    scrollRaf = 0;

    const doc = document.documentElement;
    const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
    const progress = clamp(window.scrollY / maxScroll, 0, 1);
    doc.style.setProperty("--scroll-progress", String(progress));

    const bar = document.querySelector(".scroll-progress");
    if (bar) bar.setAttribute("aria-valuenow", String(Math.round(progress * 100)));

    const hero = document.querySelector("[data-parallax-root]");
    if (hero) {
      const rect = hero.getBoundingClientRect();
      const heroProgress = clamp(-rect.top / Math.max(rect.height, 1), 0, 1);
      const parallaxY = heroProgress * 56;
      hero.style.setProperty("--parallax-y", parallaxY.toFixed(2) + "px");
    }

    const timeline = document.querySelector(".timeline-wrap");
    if (timeline) {
      const rect = timeline.getBoundingClientRect();
      const view = window.innerHeight;
      const start = view * 0.78;
      const end = view * 0.22;
      const raw = (start - rect.top) / Math.max(rect.height + (start - end), 1);
      doc.style.setProperty("--timeline-progress", String(clamp(raw, 0, 1)));
    }
  }

  function requestScrollMotion() {
    if (scrollRaf) return;
    scrollRaf = window.requestAnimationFrame(updateScrollMotion);
  }

  function bindScrollMotion() {
    if (reduceMotion) {
      showAllMotion();
      return;
    }

    updateScrollMotion();
    window.addEventListener("scroll", requestScrollMotion, { passive: true });
    window.addEventListener("resize", requestScrollMotion);
  }

  function bindReveal() {
    if (revealObserver) revealObserver.disconnect();
    if (itemObserver) itemObserver.disconnect();

    const sections = document.querySelectorAll("[data-reveal], .reveal");
    const items = document.querySelectorAll(".motion-item");

    if (reduceMotion || !("IntersectionObserver" in window)) {
      showAllMotion();
      return;
    }

    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -10% 0px" }
    );

    itemObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          itemObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    sections.forEach(function (node) {
      if (!node.classList.contains("is-visible")) {
        revealObserver.observe(node);
      }
    });

    items.forEach(function (node) {
      node.classList.remove("is-visible");
      itemObserver.observe(node);
    });
  }

  function bindHeroEntrance() {
    if (reduceMotion) {
      document.documentElement.classList.add("hero-ready");
      return;
    }
    window.requestAnimationFrame(function () {
      document.documentElement.classList.add("hero-ready");
    });
  }

  applyLanguage(currentLang());
  bindHeader();
  bindNav();
  bindLang();
  bindSmoothScroll();
  bindScrollMotion();
  bindHeroEntrance();
})();
