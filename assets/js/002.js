// By: h01000110 (hi)
// github.com/h01000110

function numbers () {
	// Only real fenced code blocks (<pre><code>) get line numbers.
	// Inline code spans (`like this`) and the mermaid source block are
	// excluded, since rewriting them breaks inline code (empties 1-line
	// snippets) and breaks mermaid (mangles its syntax before it renders).
	var fields = document.querySelectorAll("pre code:not([class*='language-mermaid'])");
	for (var field = 0; field < fields.length; field++) {
		var num = 0;
		var select = fields[field].innerText;
		var select_f = select.split(/\n/);
		var tab = document.createElement("table");

		// IF YOU USE MARKDOWN AND YOU HAVE BEEN GETTING ONE ADDITIONAL LINE IN YOUR TAG CODE
		// UNCOMMENT THE SECTION BELOW

		/* MARKDOWN SECTION /**/

		select_f.splice(-1, 1);

		/* END OF SECTION*/

		// Stash the clean original source on the <pre> (before it's split
		// across table cells below) so the copy button added elsewhere can
		// just read this attribute instead of trying to reconstruct the
		// code from the line-numbered table.
		if (fields[field].parentElement) {
			fields[field].parentElement.setAttribute("data-code-text", select_f.join("\n"));
		}

		// Highlight each line on its own, against its own plain text, *before* it goes
		// into the table below. hljs used to run afterward on the whole <code> element,
		// but by then every line was split across separate <th> cells with no real "\n"
		// between them (table cells don't contribute newlines to textContent) — so a
		// single-line "//" comment on one line had no line break left to stop at, and
		// hljs colored everything after it as part of that same comment. Highlighting
		// each line here, while it's still one real string, avoids that entirely.
		var langMatch = fields[field].className.match(/language-(\S+)/);
		var lang = (langMatch && window.hljs && hljs.getLanguage(langMatch[1])) ? langMatch[1] : null;

		fields[field].innerHTML = "";
		fields[field].appendChild(tab);
		for (var line = 0; line < select_f.length; line++) {
			var row = document.createElement("tr");
			var col = document.createElement("th");
			var colc = document.createElement("th");
			col.innerText = num + 1;
			if (lang) {
				colc.innerHTML = hljs.highlight(lang, select_f[line], true).value;
			} else {
				colc.innerText = select_f[line];
			}
			row.appendChild(col);
			row.appendChild(colc);
			tab.appendChild(row);
			num = num + 1;

			// STYLE SECTION - If you want, change it below

			col.style.textAlign = "right";
			colc.style.textAlign = "left";
			tab.style.border = "0";
			col.style.border = "0";
			colc.style.border = "0";
			col.style.padding = "3px";
			colc.style.padding = "3px";
			col.style.borderRight = "2px solid #777777";

			// END OF SECTION

		}
		if (lang) { fields[field].classList.add("hljs"); }
	}
}

window.onload = numbers();
