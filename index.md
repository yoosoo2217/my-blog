---
layout: default
title: 유수의 학습 블로그
show_profile: true
---



<!-- ==================== 전체 진행률 ==================== -->

<div style="margin: 2rem 10px;">

  <p id="progress-text" style="font-size:1.1rem; font-weight:600;">
    loading...
  </p>

  <div style="
    width:90%;
    height:10px;
    background:#e2e2e2;
    border-radius:999px;
    overflow:hidden;
  ">
    <div id="progress-bar-fill"
         style="
           height:100%;
           width:0%;
           background:linear-gradient(90deg,#0D9488,#5EEAD4);
           border-radius:999px;
           transition:width .6s ease;
         ">
    </div>
  </div>

</div>

<script>
(function () {

  var startDate = new Date('2026-08-26T00:00:00');
  var endDate   = new Date('2027-02-16T00:00:00');

  startDate.setHours(0,0,0,0);
  endDate.setHours(0,0,0,0);

  var totalDays =
    Math.floor((endDate - startDate) / 86400000) + 1;

  var today = new Date();
  today.setHours(0,0,0,0);

  var day =
    Math.floor((today - startDate) / 86400000) + 1;

  if (day < 1) {
    day = 1;
  }

  if (day > totalDays) {
    day = totalDays;
  }

  var pct =
    Math.round((day / totalDays) * 100);

  document.getElementById('progress-text').textContent =
    ' - DAY ' +
    day +
    ' / ' +
    totalDays +
    ' (' +
    pct +
    '%)';

  document.getElementById('progress-bar-fill').style.width =
    pct + '%';

})();
</script>


<!-- ==================== 최근 학습 기록 ==================== -->
 
<h2 style="margin-left:10px;">- RECENT STUDY LOG</h2>

<div style="margin: 2rem 10px;">

  {% for post in site.posts limit:6 %}

  <div style="
    padding:1rem 10px;
    border-bottom:1px solid #eee;
  ">

    <span style="font-size:0.85rem; color:#777;">
      {{ post.date | date: "%Y.%m.%d" }}
    </span>

    <br>

    <a href="{{ site.baseurl }}{{ post.url }}">
      <strong>{{ post.title }}</strong>
    </a>

  </div>

  {% endfor %}

</div>


<!-- ==================== 학습 캘린더 ==================== -->

<h2 style="margin-left:10px;">- STUDY CALENDER</h2>

<p style="color:#777; font-size:0.9rem;">

</p>

<div id="study-calendar" style="
  margin:1rem 10px;
  padding:1.3rem;
  max-width:600px;
  background:#fff8ff;
  border-width:2px;
  border-style:ridge groove groove ridge;
  border-color:#7f787f #fff8ff #fff8ff #7f787f;
">

  <div style="
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:1rem;
  ">

    <button
      onclick="changeMonth(-1)"
      style="
        border:0;
        background:none;
        cursor:pointer;
        font-size:1.2rem;
      "
    >
      ←
    </button>

    <strong id="calendar-title"></strong>

    <button
      onclick="changeMonth(1)"
      style="
        border:0;
        background:none;
        cursor:pointer;
        font-size:1.2rem;
      "
    >
      →
    </button>

  </div>

  <div id="calendar-grid" style="
    display:grid;
    grid-template-columns:repeat(7, 1fr);
    gap:5px;
    text-align:center;
  ">
  </div>

  <div id="calendar-selected" style="
    margin-top:1rem;
    padding-top:0.8rem;
    border-top:1px solid #ccc;
    font-size:0.9rem;
  ">
    <span style="color:#777;">날짜를 선택하면 그날그날 공부한 내용을 볼 수 잇오! ↑(￣︶￣)↑　</span>
  </div>

</div>


<!-- ==================== GitHub 연동 ==================== -->

<h2 style="margin-left:10px;">- GITHUB WORKS</h2>
<div style="margin:30px 10px 0;">

  <img src="https://streak-stats.demolab.com/?user=yoosoo2217&ring=00007F&fire=00007F&currStreakLabel=00007F">

</div>

<!-- ==================== 방문자 수 ==================== -->

<h2 style="margin-left:10px;">- VISITORS</h2>

<div style="margin: 2rem 10px;">

  <img
    src="https://api.visitorbadge.io/api/visitors?path=yoosoo2217%2Fmy-blog&label=VISITERS"
    alt="VISITERS"
  >

</div>


<!-- ==================== 캘린더 JavaScript ==================== -->

<script>

{% assign posts_by_date = site.posts | group_by_exp: "post", "post.date | date: '%Y-%m-%d'" %}
var postsByDate = {
{% for group in posts_by_date %}
  "{{ group.name }}": [
    {% for post in group.items %}
    { "title": {{ post.title | jsonify }}, "url": {{ post.url | prepend: site.baseurl | jsonify }} }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  ]{% unless forloop.last %},{% endunless %}
{% endfor %}
};

var currentDate = new Date();
var selectedDate = null;


function renderCalendar() {

  var year = currentDate.getFullYear();
  var month = currentDate.getMonth();

  var firstDay =
    new Date(year, month, 1).getDay();

  var lastDate =
    new Date(year, month + 1, 0).getDate();

  var title =
    document.getElementById("calendar-title");

  title.textContent =
    year + "." + (month + 1) + ".";

  var grid =
    document.getElementById("calendar-grid");

  grid.innerHTML = "";


  var days = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat"
  ];


  days.forEach(function(day) {

    var header =
      document.createElement("div");

    header.textContent = day;

    header.style.fontWeight = "600";
    header.style.fontSize = "0.8rem";
    header.style.padding = "5px";

    grid.appendChild(header);

  });


  for (var i = 0; i < firstDay; i++) {

    var empty =
      document.createElement("div");

    grid.appendChild(empty);

  }


  for (
    let date = 1;
    date <= lastDate;
    date++
  ) {

    var cell =
      document.createElement("div");

    let monthString =
      String(month + 1).padStart(2, "0");

    let dateString =
      String(date).padStart(2, "0");

    let fullDate =
      year +
      "-" +
      monthString +
      "-" +
      dateString;


    cell.textContent = date;

    cell.style.padding = "8px 4px";
    cell.style.borderRadius = "6px";
    cell.style.fontSize = "0.85rem";
    cell.style.cursor = "pointer";


    if (postsByDate.hasOwnProperty(fullDate)) {

      cell.style.background = "#00007F";
      cell.style.color = "white";
      cell.style.fontWeight = "600";

    }

    if (fullDate === selectedDate) {

      cell.style.outline = "2px solid #ff8800";
      cell.style.outlineOffset = "-2px";

    }

    cell.addEventListener("click", function () {

      selectedDate = fullDate;
      renderCalendar();
      showPostsForDate(fullDate);

    });


    grid.appendChild(cell);

  }

}


function showPostsForDate(dateStr) {

  var panel =
    document.getElementById("calendar-selected");

  var posts =
    postsByDate[dateStr] || [];

  var html =
    '<div style="font-weight:600; margin-bottom:6px;">' +
    dateStr +
    '</div>';

  if (posts.length === 0) {

    html +=
      '<div style="color:#777;">이 날은 작성한 글이 없습니다.</div>';

  } else {

    html += '<ul style="margin:0; padding-left:1.2rem;">';

    posts.forEach(function (post) {

      html +=
        '<li><a href="' +
        post.url +
        '">' +
        post.title +
        '</a></li>';

    });

    html += '</ul>';

  }

  panel.innerHTML = html;

}


function changeMonth(amount) {

  currentDate.setMonth(
    currentDate.getMonth() + amount
  );

  renderCalendar();

}


renderCalendar();

</script>