"""Snapshot the giscus guestbook discussion into _data/guestbook.json.

The mini guestbook in the TODAY IS window is static (GitHub Pages has no
server), so the count and the latest messages come from this snapshot. Run by
.github/workflows/guestbook-sync.yml; usable locally too:
    python scripts/sync_guestbook.py yoosoo2217/my-blog
"""
import html
import json
import re
import sys
import urllib.parse
import urllib.request

repo = sys.argv[1] if len(sys.argv) > 1 else "yoosoo2217/my-blog"
query = urllib.parse.urlencode({
    "repo": repo, "term": "/guestbook/", "number": 0,
    "strategy": "pathname", "last": 2,
})
req = urllib.request.Request(
    "https://giscus.app/api/discussions?" + query,
    headers={"User-Agent": "my-blog-guestbook-sync"},
)
with urllib.request.urlopen(req, timeout=30) as res:
    data = json.load(res)

disc = data.get("discussion") or {}  # no discussion yet -> empty guestbook
comments = disc.get("comments") or []


def plain(body_html):
    text = re.sub(r"<br\s*/?>", " ", body_html or "")
    text = re.sub(r"<[^>]*>", "", text)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


recent = []
for c in reversed(comments):  # newest first
    if c.get("deletedAt") or c.get("isMinimized"):
        continue
    author = c.get("author") or {}
    recent.append({
        "author": author.get("login") or "ghost",
        "avatar": author.get("avatarUrl") or "",
        "date": (c.get("createdAt") or "")[:10],
        "body": plain(c.get("bodyHTML"))[:200],
    })

out = {"count": disc.get("totalCommentCount") or 0, "recent": recent}
with open("_data/guestbook.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
    f.write("\n")
print(json.dumps(out, ensure_ascii=False))
