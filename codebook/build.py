# -*- coding: utf-8 -*-
"""
경정청구·정부지원금 계산 앱(app/) 소스코드를 인쇄용 PDF로 만들기 위한 HTML 생성기.
- 이 파일을 실행하면 source.html이 만들어진다. render.js로 그 HTML을 PDF로 변환한다.
- 사용법은 이 폴더의 README.md 참고.
"""
import html as H
import os

from pygments import highlight
from pygments.lexers import HtmlLexer, CssLexer, JavascriptLexer
from pygments.formatters import HtmlFormatter

PROJECT_TITLE = "경정청구·정부지원금 계산 앱"
COMPANY_NAME = "강남하이클래스파트너스"
UPDATED_NOTE = "2025년 세법개정(2026년 시행) 반영 · 2026-09-18 기준 소스코드"

APP_DIR = os.path.join(os.path.dirname(__file__), "..", "app")

FILES = [
    ("index.html", "UI 마크업", HtmlLexer),
    ("style.css", "스타일", CssLexer),
    ("app.js", "탭 전환·폼 렌더링·결과 출력", JavascriptLexer),
    ("rules.js", "경정청구 항목 정의·법인세 계산", JavascriptLexer),
    ("govSupport.js", "정부지원·세액감면 매칭 규칙", JavascriptLexer),
]

formatter = HtmlFormatter(style="friendly", linenos="table", nowrap=False)
PYGMENTS_CSS = formatter.get_style_defs(".highlight")


def esc(s):
    return H.escape(s)


def read_file(name):
    with open(os.path.join(APP_DIR, name), encoding="utf-8") as f:
        return f.read()


def render_file_section(idx, name, desc, lexer_cls):
    code = read_file(name)
    line_count = code.count("\n") + 1
    highlighted = highlight(code, lexer_cls(), formatter)
    return f"""
    <section class="file-section">
      <div class="file-head">
        <div class="file-badge">{idx}</div>
        <div>
          <h2>app/{esc(name)}</h2>
          <p class="subtitle">{esc(desc)} · {line_count}줄</p>
        </div>
      </div>
      {highlighted}
    </section>"""


sections_html = "".join(
    render_file_section(i + 1, name, desc, lexer_cls)
    for i, (name, desc, lexer_cls) in enumerate(FILES)
)

toc_rows = "".join(
    f"<tr><td class='toc-num'>{i + 1}</td><td>app/{esc(name)}</td><td>{esc(desc)}</td></tr>"
    for i, (name, desc, lexer_cls) in enumerate(FILES)
)

HTML = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>{esc(PROJECT_TITLE)} 소스코드 - {esc(COMPANY_NAME)}</title>
<style>
@font-face {{
  font-family: 'Noto Sans KR';
  font-weight: 400;
  src: url('fonts/NotoSansKR-400.woff2') format('woff2');
}}
@font-face {{
  font-family: 'Noto Sans KR';
  font-weight: 700;
  src: url('fonts/NotoSansKR-700.woff2') format('woff2');
}}
@font-face {{
  font-family: 'Noto Sans KR';
  font-weight: 900;
  src: url('fonts/NotoSansKR-900.woff2') format('woff2');
}}

:root {{
  --bg: #fffdf6;
  --text: #2d2d2d;
  --muted: #6b6b6b;
  --accent: #2f6fed;
}}

* {{ box-sizing: border-box; }}

html, body {{
  margin: 0; padding: 0;
  font-family: 'Noto Sans KR', sans-serif;
  color: var(--text);
  background: var(--bg);
  font-size: 12px;
  line-height: 1.6;
}}

@page {{
  size: A4;
  margin: 16mm 14mm 18mm 14mm;
}}

code, pre, .highlight, .highlight * {{
  font-family: 'DejaVu Sans Mono', 'Liberation Mono', monospace, 'Noto Sans KR';
}}

/* ---------- Cover ---------- */
.cover {{
  height: 245mm;
  max-height: 245mm;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: linear-gradient(160deg, #1f2937 0%, #2f6fed 55%, #6fa4ff 100%);
  border-radius: 24px;
  color: white;
  page-break-after: always;
  page-break-inside: avoid;
  break-inside: avoid;
  overflow: hidden;
  padding: 16mm;
}}
.cover .company-badge {{
  display: inline-block;
  background: rgba(255,255,255,0.25);
  border: 1.5px solid rgba(255,255,255,0.6);
  border-radius: 999px;
  padding: 6px 20px;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 18px;
}}
.cover .code-icon {{ font-size: 56px; margin-bottom: 10px; }}
.cover h1 {{
  font-size: 28px;
  font-weight: 900;
  margin: 0 0 10px;
  line-height: 1.4;
}}
.cover .sub {{
  font-size: 13px;
  font-weight: 400;
  opacity: 0.9;
  max-width: 120mm;
}}
.cover .note {{
  margin-top: 30px;
  font-size: 11px;
  opacity: 0.85;
}}

/* ---------- TOC ---------- */
.toc {{
  page-break-after: always;
}}
.toc h2 {{ color: var(--accent); font-size: 18px; }}
table.toc-table {{
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  font-size: 12px;
}}
table.toc-table th {{
  background: var(--accent);
  color: white;
  text-align: left;
  padding: 8px 10px;
}}
table.toc-table td {{
  padding: 8px 10px;
  border-bottom: 1px solid #eee;
}}
.toc-num {{
  width: 24px; height: 24px;
  background: var(--accent);
  color: white;
  border-radius: 50%;
  text-align: center;
  font-weight: 700;
}}

/* ---------- File sections ---------- */
.file-section {{
  page-break-before: always;
}}
.file-head {{
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 3px solid var(--accent);
  padding-bottom: 10px;
  margin-bottom: 12px;
}}
.file-badge {{
  flex: 0 0 auto;
  width: 30px; height: 30px;
  background: var(--accent);
  color: white;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 900;
  font-size: 14px;
}}
.file-head h2 {{
  margin: 0;
  font-size: 15px;
  font-family: 'DejaVu Sans Mono', 'Liberation Mono', monospace;
  color: var(--text);
}}
.file-head .subtitle {{
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 11px;
}}

.highlight {{
  font-size: 10.5px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e8e4d8;
}}
.highlight table {{
  border-collapse: collapse;
  width: 100%;
}}
.highlight td.linenos {{
  color: #b3aa96;
  text-align: right;
  padding: 0 8px;
  user-select: none;
  border-right: 1px solid #e8e4d8;
  width: 1%;
  white-space: nowrap;
}}
.highlight td.code {{ padding: 0 0 0 10px; width: 100%; }}
.highlight pre {{
  margin: 0;
  padding: 6px 8px;
  white-space: pre-wrap;
  word-break: break-word;
}}

{PYGMENTS_CSS}
</style>
</head>
<body>

<div class="cover">
  <div class="company-badge">{esc(COMPANY_NAME)}</div>
  <div class="code-icon">💻</div>
  <h1>{esc(PROJECT_TITLE)}<br>소스코드</h1>
  <p class="sub">app/ 폴더 전체 소스 — index.html · style.css · app.js · rules.js · govSupport.js</p>
  <p class="note">{esc(UPDATED_NOTE)}</p>
</div>

<div class="toc">
  <h2>목차</h2>
  <table class="toc-table">
    <thead><tr><th>#</th><th>파일</th><th>내용</th></tr></thead>
    <tbody>
      {toc_rows}
    </tbody>
  </table>
</div>

{sections_html}

</body>
</html>
"""

with open(os.path.join(os.path.dirname(__file__), "source.html"), "w", encoding="utf-8") as f:
    f.write(HTML)

print("wrote source.html", len(HTML), "chars")
