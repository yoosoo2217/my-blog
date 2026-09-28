// Code Runner: adds a [▶ 실행] button to `javascript`/`js` fenced code
// blocks (see the capture snippet in _layouts/default.html, which must run
// before 002.js so it can grab the original source text) and runs that
// source in a Web Worker, showing console.log output / errors in a small
// Console panel below the code block. Other languages (Java included) are
// left completely untouched — no button, no wrapper, nothing.
(function () {
	var TIMEOUT_MS = 3000;

	// Static harness script run inside the worker. The actual user code is
	// sent via postMessage and evaluated with `new Function(...)` so that
	// even a syntax error is just a thrown exception we can catch, instead
	// of a fatal worker script error.
	var workerHarness = [
		'self.onmessage = function (e) {',
		'	function format(v) {',
		'		if (typeof v === "string") return v;',
		'		if (v === undefined) return "undefined";',
		'		if (v === null) return "null";',
		'		try { return JSON.stringify(v); } catch (err) { return String(v); }',
		'	}',
		'	console.log = function () {',
		'		var parts = [];',
		'		for (var i = 0; i < arguments.length; i++) { parts.push(format(arguments[i])); }',
		'		self.postMessage({ type: "log", text: parts.join(" ") });',
		'	};',
		'	try {',
		'		(new Function(e.data.code))();',
		'	} catch (err) {',
		'		self.postMessage({ type: "error", text: (err && err.name) ? (err.name + ": " + err.message) : String(err) });',
		'	}',
		'	self.postMessage({ type: "done" });',
		'};'
	].join('\n');

	var workerBlobUrl = null;
	function getWorkerUrl() {
		if (!workerBlobUrl) {
			var blob = new Blob([workerHarness], { type: 'application/javascript' });
			workerBlobUrl = URL.createObjectURL(blob);
		}
		return workerBlobUrl;
	}

	function appendLine(outputEl, text, isError) {
		var line = document.createElement('span');
		line.className = 'code-runner-line' + (isError ? ' code-runner-error' : '');
		line.textContent = (isError ? '❌ ' : '> ') + text;
		outputEl.appendChild(line);
	}

	function runCode(source, outputEl, runBtn) {
		outputEl.innerHTML = '';
		runBtn.disabled = true;
		runBtn.textContent = '⏳ 실행 중...';

		var worker;
		try {
			worker = new Worker(getWorkerUrl());
		} catch (e) {
			appendLine(outputEl, '이 브라우저에서는 코드를 실행할 수 없습니다.', true);
			runBtn.disabled = false;
			runBtn.textContent = '▶ 실행';
			return;
		}

		var finished = false;

		// Infinite loops (e.g. `while (true) {}`) block the worker thread
		// forever and never post a "done" message back — terminate() is the
		// only way to recover, so we always race execution against a timeout.
		var timer = setTimeout(function () {
			if (finished) { return; }
			finished = true;
			worker.terminate();
			appendLine(outputEl, '실행 시간이 초과되어 중단되었습니다.', true);
			runBtn.disabled = false;
			runBtn.textContent = '▶ 실행';
		}, TIMEOUT_MS);

		worker.onmessage = function (e) {
			if (finished) { return; }
			var msg = e.data || {};
			if (msg.type === 'log') {
				appendLine(outputEl, msg.text, false);
			} else if (msg.type === 'error') {
				appendLine(outputEl, msg.text, true);
			} else if (msg.type === 'done') {
				finished = true;
				clearTimeout(timer);
				worker.terminate();
				runBtn.disabled = false;
				runBtn.textContent = '▶ 실행';
				if (!outputEl.childNodes.length) {
					appendLine(outputEl, '(출력 없음)', false);
				}
			}
		};

		worker.onerror = function (e) {
			if (finished) { return; }
			finished = true;
			clearTimeout(timer);
			appendLine(outputEl, (e && e.message) ? e.message : '알 수 없는 오류가 발생했습니다.', true);
			runBtn.disabled = false;
			runBtn.textContent = '▶ 실행';
			worker.terminate();
			if (e && e.preventDefault) { e.preventDefault(); }
		};

		worker.postMessage({ code: source });
	}

	function buildUI(entry) {
		var codeEl = document.querySelector('[data-code-runner-id="' + entry.id + '"]');
		if (!codeEl) { return; }
		var preEl = codeEl.closest('pre');
		if (!preEl || !preEl.parentNode) { return; }

		var wrap = document.createElement('div');
		wrap.className = 'code-runner-wrap';
		preEl.parentNode.insertBefore(wrap, preEl);

		var toolbar = document.createElement('div');
		toolbar.className = 'code-runner-toolbar';

		var label = document.createElement('span');
		label.className = 'code-runner-label';
		label.textContent = 'JavaScript';

		var runBtn = document.createElement('button');
		runBtn.type = 'button';
		runBtn.className = 'code-runner-btn';
		runBtn.textContent = '▶ 실행';
		runBtn.setAttribute('aria-label', '코드 실행');
		runBtn.title = '코드 실행';

		toolbar.appendChild(label);
		toolbar.appendChild(runBtn);

		wrap.appendChild(toolbar);
		wrap.appendChild(preEl);

		var consoleBox = document.createElement('div');
		consoleBox.className = 'code-runner-console';
		consoleBox.hidden = true;

		var consoleTitle = document.createElement('div');
		consoleTitle.className = 'code-runner-console-title';

		var consoleTitleText = document.createElement('span');
		consoleTitleText.textContent = 'Console';

		var clearBtn = document.createElement('button');
		clearBtn.type = 'button';
		clearBtn.className = 'code-runner-clear-btn';
		clearBtn.textContent = '🗑 지우기';
		clearBtn.setAttribute('aria-label', '실행 결과 지우기');
		clearBtn.title = '결과 지우기';

		consoleTitle.appendChild(consoleTitleText);
		consoleTitle.appendChild(clearBtn);

		var outputEl = document.createElement('div');
		outputEl.className = 'code-runner-output';

		consoleBox.appendChild(consoleTitle);
		consoleBox.appendChild(outputEl);
		wrap.parentNode.insertBefore(consoleBox, wrap.nextSibling);

		runBtn.addEventListener('click', function () {
			consoleBox.hidden = false;
			runCode(entry.source, outputEl, runBtn);
		});

		clearBtn.addEventListener('click', function () {
			outputEl.innerHTML = '';
			consoleBox.hidden = true;
		});
	}

	function init() {
		var registry = window.__codeRunnerRegistry || [];
		for (var i = 0; i < registry.length; i++) {
			buildUI(registry[i]);
		}
	}

	init();
})();
