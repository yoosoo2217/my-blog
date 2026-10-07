// By: h01000110 (hi)
// github.com/h01000110

// The post window's maximize button folds the explorer window above it and
// lets the post window fill the screen (see .win95-doc-maximized in
// _main.scss). The minimize button, the maximize button again, or Esc
// restores the normal layout.
var MAXIMIZED_CLASS = "win95-doc-maximized";

function setMaximized (on) {
	document.documentElement.classList.toggle(MAXIMIZED_CLASS, on);
	var maxBtn = document.querySelector(".post_title .btn_max");
	if (maxBtn) {
		maxBtn.setAttribute("aria-pressed", on ? "true" : "false");
		maxBtn.title = on ? "원래 크기" : "크게 보기";
	}
}

function toggleMaximize () {
	setMaximized(!document.documentElement.classList.contains(MAXIMIZED_CLASS));
}

var maxBtn = document.querySelector(".post_title .btn_max");
if (maxBtn) {
	var postBtns = document.querySelectorAll(".post_title .btn");
	var minBtn = postBtns[postBtns.length - 1];

	maxBtn.title = "크게 보기";
	maxBtn.addEventListener("click", toggleMaximize, false);
	if (minBtn && minBtn !== maxBtn) {
		minBtn.addEventListener("click", function () { setMaximized(false); }, false);
	}
	document.addEventListener("keydown", function (e) {
		if (e.key === "Escape") { setMaximized(false); }
	}, false);
}
