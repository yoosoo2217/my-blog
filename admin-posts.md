---
layout: default
title: "글 수정"
permalink: /admin-posts/
sitemap: false
---

이미 올라간 글을 배포된 사이트에서 바로 고칠 수 있는 곳이다. 아래 목록에서 글을 고르면 그 글의 원문(머리말 포함 마크다운 전체)이 그대로 불러와지고, 고친 뒤 저장하면 그 글 파일에 바로 커밋된다. [TMI 관리자]({{ site.baseurl }}/admin-tmi/)와 토큰을 공유하니, 거기서 이미 저장해뒀다면 여기서도 그대로 쓰면 된다.

**머리말(`title`/`date`/`tags`)까지 전부 포함된 원문이니, `---`로 감싼 부분을 지우거나 형식을 깨뜨리지 않도록 조심하자.**

<div class="post-admin">
	<div class="post-admin-row">
		<label for="post-select">수정할 글</label>
		<select id="post-select">
			<option value="">-- 글 선택 --</option>
			{% assign posts_by_date = site.posts | sort: "date" | reverse %}
			{% for post in posts_by_date %}
			<option value="{{ post.path }}">{{ post.date | date: '%Y-%m-%d' }} — {{ post.title }}</option>
			{% endfor %}
		</select>
	</div>

	<div class="post-admin-row">
		<label for="post-token">GitHub 토큰</label>
		<input type="password" id="post-token" placeholder="github_pat_..." autocomplete="off" />
		<button type="button" id="post-token-clear">토큰 지우기</button>
	</div>

	<div class="post-admin-row">
		<button type="button" id="post-load">불러오기</button>
	</div>

	<textarea id="post-text" rows="24" placeholder="글을 선택하고 불러오기를 누르면 여기에 원문이 떠."></textarea>

	<div class="post-admin-row">
		<button type="button" id="post-save">저장</button>
		<span id="post-status"></span>
	</div>
</div>

<script>
(function () {
	var OWNER = 'yoosoo2217';
	var REPO = 'my-blog';
	var BRANCH = 'main';
	var TOKEN_KEY = 'yusu-admin-gh-token';

	var selectEl = document.getElementById('post-select');
	var tokenInput = document.getElementById('post-token');
	var clearBtn = document.getElementById('post-token-clear');
	var loadBtn = document.getElementById('post-load');
	var saveBtn = document.getElementById('post-save');
	var textArea = document.getElementById('post-text');
	var statusEl = document.getElementById('post-status');
	var currentSha = null;
	var currentPath = null;

	try {
		var saved = localStorage.getItem(TOKEN_KEY);
		if (saved) { tokenInput.value = saved; }
	} catch (e) { /* private mode etc. */ }

	function setStatus(msg, isError) {
		statusEl.textContent = msg;
		statusEl.style.color = isError ? '#aa0000' : '#006600';
	}

	// Contents API paths need each segment percent-encoded (posts can have
	// Korean filenames), but the "/" separators themselves must stay raw.
	function encodeRepoPath(path) {
		return path.split('/').map(encodeURIComponent).join('/');
	}

	// Same UTF-8-safe base64 round-trip as the TMI admin page — GitHub's
	// Contents API works in raw UTF-8 bytes, not JS's UTF-16 code units.
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

	// Switching posts (or leaving the page) with unsaved edits would silently
	// throw away whatever's in the textarea, so both are guarded with a confirm.
	selectEl.addEventListener('change', function () {
		if (textArea.value && !confirm('지금 글 내용을 저장 안 했는데, 다른 글로 바꿀까?')) {
			selectEl.value = currentPath || '';
			return;
		}
		textArea.value = '';
		currentSha = null;
		currentPath = null;
		setStatus('');
	});

	loadBtn.addEventListener('click', function () {
		var token = tokenInput.value.trim();
		var path = selectEl.value;
		if (!path) { setStatus('글을 먼저 선택해줘.', true); return; }
		if (!token) { setStatus('토큰을 먼저 입력해줘.', true); return; }
		setStatus('불러오는 중...');
		fetch('https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + encodeRepoPath(path) + '?ref=' + BRANCH, {
			headers: apiHeaders(token)
		}).then(function (res) {
			if (!res.ok) { throw new Error('불러오기 실패 (' + res.status + ') — 토큰을 확인해줘.'); }
			return res.json();
		}).then(function (data) {
			currentSha = data.sha;
			currentPath = path;
			textArea.value = base64ToUtf8(data.content);
			try { localStorage.setItem(TOKEN_KEY, token); } catch (e) {}
			setStatus('불러왔어. 수정하고 저장을 누르면 돼.');
		}).catch(function (err) {
			setStatus(err.message || '불러오기 실패', true);
		});
	});

	saveBtn.addEventListener('click', function () {
		var token = tokenInput.value.trim();
		if (!token) { setStatus('토큰을 먼저 입력해줘.', true); return; }
		if (!currentPath || !currentSha) { setStatus('먼저 불러오기를 눌러줘.', true); return; }
		if (!/^---\s*[\r\n]/.test(textArea.value)) {
			if (!confirm('머리말(---로 시작하는 부분)이 없어 보이는데, 그래도 저장할까?')) { return; }
		}
		setStatus('저장하는 중...');
		fetch('https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + encodeRepoPath(currentPath), {
			method: 'PUT',
			headers: Object.assign(apiHeaders(token), { 'Content-Type': 'application/json' }),
			body: JSON.stringify({
				message: 'docs: edit ' + currentPath + ' via admin page',
				content: utf8ToBase64(textArea.value),
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
.post-admin {
	max-width: 760px;
}
.post-admin-row {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 10px;
	flex-wrap: wrap;
}
.post-admin label {
	font-weight: bold;
	font-size: 13px;
}
.post-admin select {
	flex: 1 1 320px;
	min-width: 200px;
	padding: 4px 6px;
	border: 2px solid;
	border-color: #7f787f #fff8ff #fff8ff #7f787f;
	font-family: inherit;
	font-size: 13px;
	box-sizing: border-box;
}
.post-admin input[type="password"] {
	flex: 1 1 220px;
	min-width: 160px;
	padding: 4px 6px;
	border: 2px solid;
	border-color: #7f787f #fff8ff #fff8ff #7f787f;
	font-family: inherit;
	font-size: 13px;
	box-sizing: border-box;
}
.post-admin textarea {
	width: 100%;
	box-sizing: border-box;
	padding: 6px 8px;
	border: 2px solid;
	border-color: #7f787f #fff8ff #fff8ff #7f787f;
	font-family: Consolas, "Courier New", monospace;
	font-size: 13px;
	line-height: 1.5;
	margin-bottom: 10px;
	resize: vertical;
}
.post-admin button {
	background: #cfcfcf;
	color: #000000;
	border: 2px solid;
	border-color: #fff8ff #000000 #000000 #fff8ff;
	font-family: inherit;
	font-size: 13px;
	padding: 4px 10px;
	cursor: pointer;
}
.post-admin button:active {
	border-color: #000000 #fff8ff #fff8ff #000000;
}
#post-status {
	font-size: 12px;
}
</style>

## 주의할 점

- 저장은 바로 `main` 브랜치에 커밋돼. 되돌리고 싶으면 저장소의 커밋 기록에서 되돌리면 된다.
- 파일명(날짜·제목)은 여기서 못 바꾼다. 내용만 수정하는 용도다.
- 토큰 만드는 방법은 [TMI 관리자]({{ site.baseurl }}/admin-tmi/) 페이지에 적어둔 것과 같다 (`my-blog` 저장소 한정, Contents: Read and write).
