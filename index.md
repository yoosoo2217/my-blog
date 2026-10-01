---
layout: default
title: 유수의 학습 블로그
show_profile: true
---



<!-- ==================== 전체 진행률 ==================== -->

<div style="margin: 2rem 10px;">

  <p id="progress-text" style="font-size:1.2rem; font-weight:700; margin-bottom:6px;">
    loading...
  </p>

  <div style="
    width:90%;
    max-width:520px;
    height:14px;
    background:#fff8ff;
    border-width:2px;
    border-style:ridge groove groove ridge;
    border-color:#7f787f #fff8ff #fff8ff #7f787f;
    overflow:hidden;
  ">
    <div id="progress-bar-fill"
         style="
           height:100%;
           width:0%;
           background:#00007f;
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


<!-- ==================== 주간 학습 흐름 ==================== -->

<h2 style="margin-left:10px;">- WEEKLY STUDY FLOW</h2>

<div class="win95-weekflow">
  <div class="win95-weekflow-header">
    <span class="win95-weekflow-dot"></span>
    <span class="win95-weekflow-title">이번 주 학습 흐름</span>
    <a href="#post_list" class="win95-weekflow-all">전체 흐름 ↑</a>
  </div>

  <div class="win95-weekflow-weeks">
    {% assign weeks = site.posts | group_by_exp: "post", "post.date | date: '%Y-%U'" %}
    {% assign weeks_sorted = weeks | sort: "name" | reverse %}
    {% for week in weeks_sorted limit:2 %}
      {% assign week_posts_asc = week.items | sort: "date" %}
      {% assign week_posts_desc = week_posts_asc | reverse %}
      {% assign range_start = week_posts_asc | first %}
      {% assign range_end = week_posts_asc | last %}
      {% assign rep_ts = range_start.date | date: "%s" %}
      {% assign rep_days = rep_ts | minus: 1787702400 | divided_by: 86400 %}
      {% assign course_week = rep_days | divided_by: 7 | plus: 1 %}
      {% assign shown = week_posts_desc | slice: 0, 3 %}
      {% assign extra = week.items.size | minus: 3 %}
      <div class="win95-weekflow-col{% if forloop.first %} win95-weekflow-current{% endif %}">
        <div class="win95-weekflow-weeklabel">
          Week {{ course_week }}
          <span class="win95-weekflow-range">{{ range_start.date | date: "%m.%d" }} - {{ range_end.date | date: "%m.%d" }}</span>
        </div>
        <div class="win95-weekflow-line">
          {% for post in shown %}
          <a class="win95-weekflow-item" href="{{ site.baseurl }}{{ post.url }}">
            <span class="win95-weekflow-node"></span>
            <span class="win95-weekflow-date">{{ post.date | date: "%m.%d" }}</span>
            <span class="win95-weekflow-post-title">{{ post.title }}</span>
          </a>
          {% endfor %}
        </div>
        {% if extra > 0 %}
        <div class="win95-weekflow-more">+ {{ extra }}편 더</div>
        {% endif %}
      </div>
    {% endfor %}
  </div>
</div>


<!-- ==================== 최근 학습 기록 ==================== -->
 
<h2 style="margin-left:10px;">- RECENT STUDY LOG</h2>

<div class="win95-explorer-list">
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Modified</th>
      </tr>
    </thead>
    <tbody>
      {% for post in site.posts limit:6 %}
      <tr onclick="location.href='{{ site.baseurl }}{{ post.url }}'">
        <td><a href="{{ site.baseurl }}{{ post.url }}">📄 {{ post.title }}</a></td>
        <td>Document</td>
        <td>{{ post.date | date: "%m/%d" }}</td>
      </tr>
      {% endfor %}
    </tbody>
  </table>
</div>


<!-- ==================== 학습 캘린더 ==================== -->

<h2 style="margin-left:10px;">- STUDY CALENDAR</h2>

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
        border-width:2px;
        border-style:solid;
        border-color:#fff8ff #000000 #000000 #fff8ff;
        background:#bfb8bf;
        cursor:pointer;
        font-size:1rem;
        padding:2px 10px;
        font-family:Tahoma, 'MS Sans Serif', Geneva, Verdana, sans-serif;
      "
      onmousedown="this.style.borderColor='#000000 #fff8ff #fff8ff #000000'"
      onmouseup="this.style.borderColor='#fff8ff #000000 #000000 #fff8ff'"
    >
      ←
    </button>

    <strong id="calendar-title"></strong>

    <button
      onclick="changeMonth(1)"
      style="
        border-width:2px;
        border-style:solid;
        border-color:#fff8ff #000000 #000000 #fff8ff;
        background:#bfb8bf;
        cursor:pointer;
        font-size:1rem;
        padding:2px 10px;
        font-family:Tahoma, 'MS Sans Serif', Geneva, Verdana, sans-serif;
      "
      onmousedown="this.style.borderColor='#000000 #fff8ff #fff8ff #000000'"
      onmouseup="this.style.borderColor='#fff8ff #000000 #000000 #fff8ff'"
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