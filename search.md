---
layout: default
title: 검색
permalink: /search/
show_profile: true
---

<div style="margin:0.5rem 0 1rem;">
  <input
    type="text"
    id="search-input"
    placeholder="search.."
    style="
      width:100%;
      max-width:400px;
      padding:6px 8px;
      box-sizing:border-box;
      background:#fbfaf7;
      border-width:2px;
      border-style:ridge groove groove ridge;
      border-color:#7f7d7f #fbfaf7 #fbfaf7 #7f7d7f;
      font-family:Tahoma, 'MS Sans Serif', Geneva, Verdana, sans-serif;
      font-size:13px;
    "
  >
</div>

<p id="search-hint" style="color:#555; font-size:0.85rem;">제목, 태그, 본문 내용을 검색해주세용! 단어를 띄어쓰면 모두 포함된 글만 찾아요.</p>
<p id="search-count" style="color:#555; font-size:0.85rem; display:none;"></p>
<p id="search-empty" style="color:#555; display:none;">검색 결과가 없습니당..</p>

<ul id="search-results" style="list-style:none; padding:0; margin:0;"></ul>

<style>
  #search-results mark {
    background: #0a246a;
    color: #ffffff;
    padding: 0 1px;
  }
  .search-snippet {
    margin-top: 3px;
    font-size: 0.8rem;
    color: #444;
    line-height: 1.5;
    word-break: break-word;
  }
</style>

<script>
(function () {
  var input = document.getElementById('search-input');
  var results = document.getElementById('search-results');
  var empty = document.getElementById('search-empty');
  var hint = document.getElementById('search-hint');
  var count = document.getElementById('search-count');
  var data = [];

  fetch('{{ site.baseurl }}/search.json')
    .then(function (res) { return res.json(); })
    .then(function (json) { data = json; })
    .catch(function () { data = []; });

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Escapes the text, then wraps every search term in <mark>.
  function highlight(text, terms) {
    var safe = esc(text);
    if (!terms.length) { return safe; }
    var re = new RegExp('(' + terms.map(function (t) { return escRe(esc(t)); }).join('|') + ')', 'gi');
    return safe.replace(re, '<mark>$1</mark>');
  }

  // ~40 characters either side of the earliest match in the body text.
  function snippet(content, terms) {
    var lower = content.toLowerCase();
    var at = -1;
    for (var i = 0; i < terms.length; i++) {
      var p = lower.indexOf(terms[i]);
      if (p !== -1 && (at === -1 || p < at)) { at = p; }
    }
    if (at === -1) { return ''; }
    var start = Math.max(0, at - 40);
    var end = Math.min(content.length, at + 80);
    return (start > 0 ? '… ' : '') + content.slice(start, end) + (end < content.length ? ' …' : '');
  }

  function render(list, terms) {
    results.innerHTML = '';
    list.forEach(function (item) {
      var post = item.post;
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
      a.innerHTML = '<strong>' + highlight(post.title, terms) + '</strong>';
      li.appendChild(a);

      if (post.tags && post.tags.length) {
        var tagSpan = document.createElement('div');
        tagSpan.style.fontSize = '0.75rem';
        tagSpan.style.color = '#888';
        tagSpan.innerHTML = highlight(post.tags.join(', '), terms);
        li.appendChild(tagSpan);
      }

      var snip = snippet(post.content, terms);
      if (snip) {
        var s = document.createElement('div');
        s.className = 'search-snippet';
        s.innerHTML = highlight(snip, terms);
        li.appendChild(s);
      }

      results.appendChild(li);
    });
  }

  input.addEventListener('input', function () {
    var q = input.value.trim().toLowerCase();

    if (!q) {
      results.innerHTML = '';
      empty.style.display = 'none';
      count.style.display = 'none';
      hint.style.display = 'block';
      return;
    }

    hint.style.display = 'none';
    var terms = q.split(/\s+/);

    var matches = [];
    data.forEach(function (post) {
      var title = post.title.toLowerCase();
      var tags = (post.tags || []).join(' ').toLowerCase();
      var content = post.content.toLowerCase();
      var inTitle = 0;
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i];
        var hitTitle = title.indexOf(t) !== -1;
        if (!hitTitle && tags.indexOf(t) === -1 && content.indexOf(t) === -1) { return; }
        if (hitTitle) { inTitle++; }
      }
      matches.push({ post: post, score: inTitle });
    });

    // Posts whose title matches come first; otherwise keep newest-first order.
    matches.sort(function (a, b) { return b.score - a.score; });

    empty.style.display = matches.length === 0 ? 'block' : 'none';
    count.style.display = matches.length === 0 ? 'none' : 'block';
    count.textContent = matches.length + '개의 글을 찾았어요';
    render(matches, terms);
  });
})();
</script>
