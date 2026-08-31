---
title: 홈
layout: default
nav_order: 1
---

# 유수의 학습 노트

부트캠프에서 배우는 내용을 기록하는 학습 노트입니다.

<!-- ==================== 부트캠프 진행률 ==================== -->

<div style="margin: 2rem 0;">

  <p id="progress-text" style="font-size:1.1rem; font-weight:600;">
    전체 진행률: 계산 중...
  </p>

  <div style="width:100%; height:10px; background:#e2e2e2; border-radius:999px; overflow:hidden;">
    <div id="progress-bar-fill"
         style="height:100%; width:0%; background:linear-gradient(90deg,#3b82f6,#22c55e); border-radius:999px; transition:width .6s ease;">
    </div>
  </div>

</div>

<script>
(function () {

  var startDate = new Date('2026-08-26T00:00:00');
  var endDate   = new Date('2027-02-16T00:00:00');

  startDate.setHours(0,0,0,0);
  endDate.setHours(0,0,0,0);

  var totalDays = Math.floor((endDate - startDate) / 86400000) + 1;

  var today = new Date();
  today.setHours(0,0,0,0);

  var day = Math.floor((today - startDate) / 86400000) + 1;

  if (day < 1) {
    day = 1;
  }

  if (day > totalDays) {
    day = totalDays;
  }

  var pct = Math.round((day / totalDays) * 100);

  document.getElementById('progress-text').textContent =
    '전체 진행률: ' + day + '일차 / ' + totalDays + '일 (' + pct + '%)';

  document.getElementById('progress-bar-fill').style.width = pct + '%';

})();
</script>


<!-- ==================== 오늘의 학습 ==================== -->

## 📚 오늘의 학습

<div style="
  padding: 1.2rem;
  margin: 1rem 0 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fafafa;
">

  <strong>오늘 배운 내용</strong>

  <p style="margin-bottom:0.5rem;">
    GitHub Pull Request 실습
  </p>

  <small>
    오늘도 한 걸음 성장했습니다! 🚀
  </small>

</div>


<!-- ==================== 최근 학습 기록 ==================== -->

## 📝 최근 학습 기록

<div style="
  margin: 1rem 0 2rem;
">

{% for post in site.posts limit:5 %}

<div style="
  padding: 0.8rem 1rem;
  margin-bottom: 0.6rem;
  border-bottom: 1px solid #eeeeee;
">

  <span style="font-size:0.85rem; color:#777;">
    {{ post.date | date: "%Y.%m.%d" }}
  </span>

  <br>

  <a href="{{ post.url }}">
    <strong>{{ post.title }}</strong>
  </a>

</div>

{% endfor %}

</div>


<!-- ==================== 학습 캘린더 ==================== -->

## 📅 학습 캘린더

<p style="color:#777; font-size:0.9rem;">
블로그에 학습 기록을 작성한 날이 표시됩니다.
</p>

<div id="study-calendar" style="
  margin: 1rem 0 2rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
">

  <div style="
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:1rem;
  ">

    <button onclick="changeMonth(-1)"
            style="border:0; background:none; cursor:pointer; font-size:1.2rem;">
      ◀
    </button>

    <strong id="calendar-title"></strong>

    <button onclick="changeMonth(1)"
            style="border:0; background:none; cursor:pointer; font-size:1.2rem;">
      ▶
    </button>

  </div>

  <div id="calendar-grid" style="
    display:grid;
    grid-template-columns:repeat(7, 1fr);
    gap:5px;
    text-align:center;
  ">
  </div>

</div>


<!-- ==================== GitHub 활동 ==================== -->

## 😺 GitHub 활동

![GitHub Streak](https://streak-stats.demolab.com/?user=yoosoo2217)


<!-- ==================== 방문자 수 ==================== -->

## 👀 방문자 수

| 누적 방문자 |
|:---:|
| <img src="https://api.visitorbadge.io/api/visitors?user=yoosoo2217&repo=my-blog" width="40"> |


<!-- ==================== 캘린더 JavaScript ==================== -->

<script>

var studyDates = [
  "2026-08-26",
  "2026-08-27",
  "2026-08-28",
  "2026-08-30",
  "2026-08-31"
];

var currentDate = new Date();

function renderCalendar() {

  var year = currentDate.getFullYear();
  var month = currentDate.getMonth();

  var firstDay = new Date(year, month, 1).getDay();
  var lastDate = new Date(year, month + 1, 0).getDate();

  var title = document.getElementById("calendar-title");

  title.textContent =
    year + "." + (month + 1) + ".";

  var grid = document.getElementById("calendar-grid");

  grid.innerHTML = "";

  var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  days.forEach(function(day) {

    var header = document.createElement("div");

    header.textContent = day;

    header.style.fontWeight = "600";
    header.style.fontSize = "0.8rem";
    header.style.padding = "5px";

    grid.appendChild(header);

  });


  for (var i = 0; i < firstDay; i++) {

    var empty = document.createElement("div");

    grid.appendChild(empty);

  }


  for (var date = 1; date <= lastDate; date++) {

    var cell = document.createElement("div");

    var monthString = String(month + 1).padStart(2, "0");
    var dateString = String(date).padStart(2, "0");

    var fullDate =
      year + "-" + monthString + "-" + dateString;

    cell.textContent = date;

    cell.style.padding = "8px 4px";
    cell.style.borderRadius = "6px";
    cell.style.fontSize = "0.85rem";


    if (studyDates.includes(fullDate)) {

      cell.style.background = "#BFCBED";
      cell.style.color = "white";
      cell.style.fontWeight = "600";

      cell.title = "학습 기록이 있습니다 📚";

    }


    grid.appendChild(cell);

  }

}


function changeMonth(amount) {

  currentDate.setMonth(
    currentDate.getMonth() + amount
  );

  renderCalendar();

}


renderCalendar();

</script>