---
layout: default
title: "TMI 관리자"
permalink: /admin-tmi/
sitemap: false
---

홈 사이드바의 "오늘의 TMI" 문구를 여기서 바로 바꿀 수 있다. GitHub 개인 토큰이 있어야 저장되고, 그 토큰은 **이 브라우저에만** 저장된다. 아래에 토큰을 넣고 "불러오기"를 누르면 현재 문구가 뜨고, 고친 뒤 "저장"을 누르면 바로 커밋된다. GitHub Actions 빌드가 끝나면(보통 1~2분) 사이트에 반영된다.

다른 관리 도구: [글 수정]({{ site.baseurl }}/admin-posts/)

<div class="tmi-admin">
	<div class="tmi-admin-row">
		<label for="tmi-token">GitHub 토큰</label>
		<input type="password" id="tmi-token" placeholder="github_pat_..." autocomplete="off" />
		<button type="button" id="tmi-token-clear">토큰 지우기</button>
	</div>

	<div class="tmi-admin-row">
		<button type="button" id="tmi-load">불러오기</button>
	</div>

	<textarea id="tmi-text" rows="4" placeholder="오늘의 TMI 문구를 입력..."></textarea>

	<div class="tmi-admin-row">
		<button type="button" id="tmi-save">저장</button>
		<span id="tmi-status"></span>
	</div>
</div>

<script>
(function () {
	var OWNER = 'yoosoo2217';
	var REPO = 'my-blog';
	var PATH = '_data/tmi.yml';
	var BRANCH = 'main';
	var TOKEN_KEY = 'yusu-admin-gh-token';

	var tokenInput = document.getElementById('tmi-token');
	var clearBtn = document.getElementById('tmi-token-clear');
	var loadBtn = document.getElementById('tmi-load');
	var saveBtn = document.getElementById('tmi-save');
	var textArea = document.getElementById('tmi-text');
	var statusEl = document.getElementById('tmi-status');
	var currentSha = null;

	try {
		var saved = localStorage.getItem(TOKEN_KEY);
		if (saved) { tokenInput.value = saved; }
	} catch (e) { /* private mode etc. */ }

	function setStatus(msg, isError) {
		statusEl.textContent = msg;
		statusEl.style.color = isError ? '#aa0000' : '#006600';
	}

	// GitHub's Contents API returns/expects base64 of the raw UTF-8 bytes,
	// not of the JS string's UTF-16 code units — these two go through
	// TextEncoder/TextDecoder so Korean text round-trips correctly.
	function utf8ToBase64(str) {
		var bytes = new TextEncoder().encode(str);
		var binary = '';
		for (var i = 0; i < bytes.length; i++) { binary += String.fromCharCode(bytes[i]); }
		return btoa(binary);
	}
	function base64ToUtf8(b64) {
		var binary = atob(b64.replace(/\n/g, ''));
		var bytes = new Uint8Array(binary.length);
		for (var i = 0; i < binary.length; i++) { bytes[i] = binary.charCodeAt(i); }
		return new TextDecoder().decode(bytes);
	}

	// _data/tmi.yml only ever has one field, so this reads/writes it with a
	// regex + JSON string escaping instead of pulling in a YAML parser —
	// textToYaml() is always the one writing the file, so the format round-trips.
	function yamlToText(raw) {
		var m = raw.match(/text:\s*"((?:[^"\\]|\\.)*)"/);
		if (!m) { return ''; }
		try { return JSON.parse('"' + m[1] + '"'); } catch (e) { return ''; }
	}
	function textToYaml(text) {
		return 'text: ' + JSON.stringify(text) + '\n';
	}

	function apiHeaders(token) {
		return {
			'Authorization': 'Bearer ' + token,
			'Accept': 'application/vnd.github+json'
		};
	}

	clearBtn.addEventListener('click', function () {
		tokenInput.value = '';
		try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
		setStatus('토큰을 지웠어.');
	});

	loadBtn.addEventListener('click', function () {
		var token = tokenInput.value.trim();
		if (!token) { setStatus('토큰을 먼저 입력해줘.', true); return; }
		setStatus('불러오는 중...');
		fetch('https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + PATH + '?ref=' + BRANCH, {
			headers: apiHeaders(token)
		}).then(function (res) {
			if (!res.ok) { throw new Error('불러오기 실패 (' + res.status + ') — 토큰을 확인해줘.'); }
			return res.json();
		}).then(function (data) {
			currentSha = data.sha;
			textArea.value = yamlToText(base64ToUtf8(data.content));
			try { localStorage.setItem(TOKEN_KEY, token); } catch (e) {}
			setStatus('불러왔어. 수정하고 저장을 누르면 돼.');
		}).catch(function (err) {
			setStatus(err.message || '불러오기 실패', true);
		});
	});

	saveBtn.addEventListener('click', function () {
		var token = tokenInput.value.trim();
		if (!token) { setStatus('토큰을 먼저 입력해줘.', true); return; }
		if (!currentSha) { setStatus('먼저 불러오기를 눌러줘.', true); return; }
		setStatus('저장하는 중...');
		fetch('https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + PATH, {
			method: 'PUT',
			headers: Object.assign(apiHeaders(token), { 'Content-Type': 'application/json' }),
			body: JSON.stringify({
				message: 'chore: update TMI via admin page',
				content: utf8ToBase64(textToYaml(textArea.value)),
				sha: currentSha,
				branch: BRANCH
			})
		}).then(function (res) {
			if (!res.ok) {
				return res.json().then(function (body) {
					throw new Error((body && body.message) || ('저장 실패 (' + res.status + ')'));
				});
			}
			return res.json();
		}).then(function (data) {
			currentSha = data.content.sha;
			try { localStorage.setItem(TOKEN_KEY, token); } catch (e) {}
			setStatus('저장 완료! 빌드 끝나면(보통 1~2분) 사이트에 반영돼.');
		}).catch(function (err) {
			setStatus(err.message || '저장 실패', true);
		});
	});
})();
</script>

<style>
.tmi-admin {
	max-width: 480px;
}
.tmi-admin-row {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 10px;
	flex-wrap: wrap;
}
.tmi-admin label {
	font-weight: bold;
	font-size: 13px;
}
.tmi-admin input[type="password"] {
	flex: 1 1 220px;
	min-width: 160px;
	padding: 4px 6px;
	border: 2px solid;
	border-color: #7f7d7f #fbfaf7 #fbfaf7 #7f7d7f;
	font-family: inherit;
	font-size: 13px;
	box-sizing: border-box;
}
.tmi-admin textarea {
	width: 100%;
	box-sizing: border-box;
	padding: 6px 8px;
	border: 2px solid;
	border-color: #7f7d7f #fbfaf7 #fbfaf7 #7f7d7f;
	font-family: inherit;
	font-size: 13px;
	line-height: 1.5;
	margin-bottom: 10px;
	resize: vertical;
}
.tmi-admin button {
	background: #cfcfcf;
	color: #000000;
	border: 2px solid;
	border-color: #fbfaf7 #000000 #000000 #fbfaf7;
	font-family: inherit;
	font-size: 13px;
	padding: 4px 10px;
	cursor: pointer;
}
.tmi-admin button:active {
	border-color: #000000 #fbfaf7 #fbfaf7 #000000;
}
#tmi-status {
	font-size: 12px;
}
</style>

## 토큰은 어떻게 만들어?

1. GitHub 우측 상단 프로필 → **Settings** → 왼쪽 메뉴 맨 아래 **Developer settings**
2. **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
3. **Repository access**를 "Only select repositories"로 선택하고 `my-blog` 저장소만 체크
4. **Permissions** → **Repository permissions**에서 **Contents**를 **Read and write**로 설정 (나머지는 그대로 둬도 됨)
5. 만료 기간을 짧게 잡고(예: 90일), 생성된 토큰을 복사해서 위 입력창에 붙여넣기

이 토큰은 `my-blog` 저장소 하나에만 쓸 수 있도록 범위를 좁혀뒀기 때문에, 혹시 유출되더라도 피해가 이 블로그로 제한된다. 그래도 공용 컴퓨터에서는 쓰고 나서 꼭 "토큰 지우기"를 눌러줘. 토큰이 의심스러우면 GitHub **Settings → Developer settings → Personal access tokens**에서 바로 삭제(Revoke)할 수 있다.
