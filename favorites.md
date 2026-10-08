---
layout: default
title: 즐겨찾기
permalink: /favorites/
show_profile: true
---

<p id="fav-hint" style="color:#555; font-size:0.85rem;">글 페이지의 "☆ Favorite" 버튼을 눌러두면 여기 모아서 볼 수 있어요. 이 브라우저에만 저장돼요.</p>
<p id="fav-empty" style="color:#555; display:none;">아직 즐겨찾기한 글이 없습니당..</p>

<ul id="fav-results" style="list-style:none; padding:0; margin:0;"></ul>

<script>
(function () {
  var FAV_KEY = 'yusu-favorites';
  var hint = document.getElementById('fav-hint');
  var empty = document.getElementById('fav-empty');
  var results = document.getElementById('fav-results');

  var favUrls = [];
  try { favUrls = JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch (e) { favUrls = []; }

  if (favUrls.length === 0) {
    hint.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  fetch('{{ site.baseurl }}/search.json')
    .then(function (res) { return res.json(); })
    .then(function (posts) {
      var byUrl = {};
      posts.forEach(function (post) { byUrl[post.url] = post; });

      var matched = favUrls
        .map(function (url) { return byUrl[url]; })
        .filter(function (post) { return !!post; });

      if (matched.length === 0) {
        hint.style.display = 'none';
        empty.style.display = 'block';
        return;
      }

      hint.style.display = 'none';
      matched.forEach(function (post) {
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
        a.innerHTML = '★ <strong>' + post.title + '</strong>';
        li.appendChild(a);

        results.appendChild(li);
      });
    })
    .catch(function () {
      hint.style.display = 'none';
      empty.style.display = 'block';
    });
})();
</script>
