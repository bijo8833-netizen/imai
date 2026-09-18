# 경정청구·정부지원금 쉬운 가이드북 (PDF 생성기)

`app/`의 계산 앱 내용을 초등학생도 이해할 수 있도록 쉽게 풀어 쓴 전자책을 PDF로 만드는 프로그램입니다.

## 사용 방법

```bash
cd ebook
python3 build.py     # ebook.html 생성
node render.js        # ebook.html -> guidebook.pdf 변환 (Playwright + Chromium 필요)
```

결과물: `guidebook.pdf` (표지 1장 + 8개 장 + 마무리, A4 기준)

## 내용 수정하기

- **항목 내용(설명·준비서류·입력방법)**: `build.py` 안의 `CORP_ITEMS`, `VAT_ITEMS`, `CREDIT_ITEMS`, `GRANT_ITEMS`, `CHECKLIST` 리스트를 고치면 된다. 각 항목은 `(번호, 제목, 쉬운 설명, 준비서류, 입력 방법)` 튜플이다.
- **회사명**: `build.py` 맨 위의 `COMPANY_NAME` 값만 바꾸면 표지 배지가 바뀐다.
- **기준일/개정 반영 문구**: `UPDATED_NOTE` 값을 바꾼다.
- **디자인(색상·레이아웃)**: `build.py`의 `HTML` 문자열 안 `<style>` 블록을 수정한다.
- **세율·공제율 등 수치**: `app/govSupport.js`, `app/rules.js`가 최신화되면 그 내용을 `build.py`의 해당 항목 설명에도 반영해야 한다(둘은 자동 연동되지 않음).

## 폰트

`fonts/` 폴더에 Noto Sans KR(400/500/700/900) 웹폰트를 현대 한글 전체(가~힣) + 영문/기호 범위로 subset해서 넣어두었다(원본 폰트는 4개 합쳐 약 24MB인데, 이 subset은 약 2MB). 새 글자가 필요하면(예: 특수 기호) 아래처럼 다시 subset하면 된다.

```bash
pip install fonttools brotli
pyftsubset NotoSansKR-400.ttf \
  --output-file=fonts/NotoSansKR-400.woff2 \
  --flavor=woff2 \
  --unicodes="U+AC00-D7A3,U+3131-318E,U+0020-007E,U+2018-201F,U+2026,U+FF01-FF5E,U+20A9" \
  --glyph-names --symbol-cmap --legacy-cmap --notdef-glyph --notdef-outline
```

(500/700/900 웹폰트도 같은 방식으로, `--output-file`과 원본 파일명의 굵기만 바꿔서 반복한다.)

## 참고

- 계산 결과·감면율은 참고용이며 실제 신청 전 세무 전문가 확인이 필요하다는 문구가 본문에 이미 포함되어 있다.
- Playwright/Chromium이 없는 환경이라면 `ebook.html`을 아무 브라우저로나 열어서 인쇄(Ctrl/Cmd+P) → PDF로 저장해도 동일한 결과를 얻을 수 있다.
