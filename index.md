---
title: 홈
layout: default
nav_order: 1
---

# 유수의 학습 노트

부트캠프에서 배우는 내용을 기록하는 학습 노트입니다.

<div style="margin: 2rem 0;">
  <p id="progress-text" style="font-size:1.1rem; font-weight:600;">전체 진행률: 계산 중...</p>
  <div style="width:100%; height:10px; background:#e2e2e2; border-radius:999px; overflow:hidden;">
    <div id="progress-bar-fill" style="height:100%; width:0%; background:linear-gradient(90deg,#3b82f6,#22c55e); border-radius:999px; transition:width .6s ease;"></div>
  </div>
</div>

<script>
(function () {
  var startDate = new Date('2026-08-26T00:00:00'); // 부트캠프 시작일
  var totalDays = 174; // 전체 기간
  var today = new Date(); today.setHours(0,0,0,0);
  startDate.setHours(0,0,0,0);
  var day = Math.floor((today - startDate) / 86400000) + 1;
  if (day < 1) day = 1;
  if (day > totalDays) day = totalDays;
  var pct = Math.round((day / totalDays) * 100);
  document.getElementById('progress-text').textContent =
    '전체 진행률: ' + day + '일차 / ' + totalDays + '일 (' + pct + '%)';
  document.getElementById('progress-bar-fill').style.width = pct + '%';
})();
</script>

## GitHub 활동

![GitHub Streak](https://streak-stats.demolab.com/?user=yoosoo2217)

## 방문자 수

오늘 방문자: ![오늘 방문자](https://api.visitorbadge.io/api/daily?user=yoosoo2217&repo=my-blog)
누적 방문자: ![누적 방문자](https://api.visitorbadge.io/api/visitors?user=yoosoo2217&repo=my-blog)