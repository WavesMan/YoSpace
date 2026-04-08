(function initTheme() {
  var savedTheme = localStorage.getItem("demo-admin-theme");
  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  var theme = savedTheme || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);

  function updateButton(button) {
    if (!button) return;
    var current = document.documentElement.getAttribute("data-theme") || "light";
    button.textContent = current === "dark" ? "浅色模式" : "暗色模式";
    button.setAttribute("aria-pressed", String(current === "dark"));
    button.setAttribute("title", "切换主题");
  }

  function bindToggle() {
    var button = document.getElementById("themeToggle");
    if (!button) return;
    updateButton(button);
    button.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme") || "light";
      var next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("demo-admin-theme", next);
      updateButton(button);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindToggle);
  } else {
    bindToggle();
  }
})();
