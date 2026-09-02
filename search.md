---
layout: default
title: 검색
permalink: /search/
---

<div style="margin:0.5rem 0 1rem;">
  <input
    type="text"
    id="search-input"
    placeholder="검색어를 입력하세요..."
    style="
      width:100%;
      max-width:400px;
      padding:6px 8px;
      box-sizing:border-box;
      background:#fff8ff;
      border-width:2px;
      border-style:ridge groove groove ridge;
      border-color:#7f787f #fff8ff #fff8ff #7f787f;
      font-family:Tahoma, 'MS Sans Serif', Geneva, Verdana, sans-serif;
      font-size:13px;
    "
  >
</div>

<p id="search-hint" style="color:#555; font-size:0.85rem;">제목, 태그, 본문 내용을 검색합니다.</p>
<p id="search-empty" style="color:#555; display:none;">검색 결과가 없습니다.</p>

<ul id="search-results" style="list-style:none; padding:0; margin:0;"></ul>

<script>
(function () {
  var input = document.getElementById('search-input');
  var results = document.getElementById('search-results');
  var empty = document.getElementById('search-empty');
  var hint = document.getElementById('search-hint');
  var data = [];

  fetch('{{ site.baseurl }}/search.json')
    .then(function (res) { return res.json(); })
    .then(function (json) { data = json; })
    .catch(function () { data = []; });

  function render(list) {
    results.innerHTML = '';
    list.forEach(function (post) {
      var li = document.createElement('li');
      li.style.padding = '8px 0';
      li.style.borderBottom = '1px solid #ccc';

      var dateSpan = document.createElement('span');
      dateSpan.textContent = post.date;
      dateSpan.style.fontSize = '0.8rem';
      dateSpan.style.color = '#777';
      li.appendChild(dateSpan);
      li.appendChild(document.createElement('br'));

      var a = document.createElement('a');
      a.href = post.url;
      a.style.color = '#000000';
      a.innerHTML = '<strong>' + post.title + '</strong>';
      li.appendChild(a);

      if (post.tags && post.tags.length) {
        var tagSpan = document.createElement('div');
        tagSpan.style.fontSize = '0.75rem';
        tagSpan.style.color = '#888';
        tagSpan.textContent = post.tags.join(', ');
        li.appendChild(tagSpan);
      }

      results.appendChild(li);
    });
  }

  input.addEventListener('input', function () {
    var q = input.value.trim().toLowerCase();

    if (!q) {
      results.innerHTML = '';
      empty.style.display = 'none';
      hint.style.display = 'block';
      return;
    }

    hint.style.display = 'none';

    var matches = data.filter(function (post) {
      var haystack = (
        post.title + ' ' +
        (post.tags || []).join(' ') + ' ' +
        post.content
      ).toLowerCase();
      return haystack.indexOf(q) !== -1;
    });

    empty.style.display = matches.length === 0 ? 'block' : 'none';
    render(matches);
  });
})();
</script>
