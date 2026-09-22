const cookieLocale = document.cookie
  .split("; ")
  .find((value) => value.startsWith("bull-cow-locale="))
  ?.split("=")[1];
const locale = cookieLocale || navigator.language;
if (locale.toLowerCase().startsWith("en")) {
  document.documentElement.lang = "en";
  document.getElementById("title").textContent = "Connection lost";
  document.getElementById("description").textContent =
    "You need the internet to play. Check your connection and return to the game.";
  document.getElementById("retry").textContent = "Try again";
  document.getElementById("hint").textContent =
    "During a match, your place is reserved for 30 seconds after disconnection.";
}
document
  .getElementById("retry")
  .addEventListener("click", () =>
    location.pathname === "/offline.html"
      ? location.replace("/")
      : location.reload(),
  );
window.addEventListener("online", () =>
  location.pathname === "/offline.html"
    ? location.replace("/")
    : location.reload(),
);
