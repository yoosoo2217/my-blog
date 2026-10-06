---
layout: default
title: Java 학습 커리큘럼
permalink: /java-curriculum/
show_profile: true
---

<p style="color:#555; font-size:0.85rem; margin-bottom:1rem;">지금까지 쓴 Java 글을 배운 순서대로 쭉 모아뒀어요. 위에서부터 차례로 읽으면 하나로 이어집니다.</p>

<ol style="padding-left:1.4rem; margin:0;">
{% assign java_posts = site.tags['Java'] | sort: "date" %}
{% for post in java_posts %}
  <li style="margin-bottom:0.9rem; line-height:1.4;">
    <a href="{{ site.baseurl }}{{ post.url }}" style="color:#00007f; font-weight:700; text-decoration:none;">{{ post.title }}</a>
    <div style="font-size:0.75rem; color:#888;">{{ post.date | date: "%Y.%m.%d" }}</div>
  </li>
{% endfor %}
</ol>

<p style="color:#888; font-size:0.75rem; margin-top:1rem;">총 {{ java_posts | size }}편 · 새 글이 올라오면 이 목록에도 자동으로 추가됩니다.</p>
