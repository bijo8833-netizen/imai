# 경정청구·정부지원금 계산 앱 소스코드 PDF 생성기

`app/` 폴더(계산 앱)의 소스코드 전체를 구문 강조(syntax highlight)와 줄번호가 있는 인쇄용 PDF로 만드는 프로그램입니다.

## 사용 방법

```bash
cd codebook
pip install pygments          # 최초 1회만
python3 build.py               # source.html 생성
node render.js                  # source.html -> source-code.pdf 변환 (Playwright + Chromium 필요)
```

결과물: `source-code.pdf` (표지 + 목차 + `app/` 파일 5개, A4 기준)

## 내용 수정하기

- **포함 파일 목록**: `build.py`의 `FILES` 리스트 — `(파일명, 설명, pygments 렉서)` 튜플. `app/`에 파일을 추가하면 여기도 추가해야 반영된다.
- **회사명/기준일**: `build.py` 맨 위 `COMPANY_NAME`, `UPDATED_NOTE`.
- **코드 색상 테마**: `build.py`의 `HtmlFormatter(style="friendly", ...)` — pygments가 지원하는 다른 스타일 이름(`monokai`, `github-dark` 등)으로 바꿀 수 있다. 단, 인쇄용이므로 밝은 배경 스타일(`friendly`, `default`, `tango` 등)을 권장한다.

## 폰트

`fonts/` 폴더는 `ebook/fonts/`와 같은 Noto Sans KR subset(한글 전체 범위)을 그대로 복사해 두었다 — 코드 안의 한글 문자열(설명 텍스트 등)을 표시하기 위함이다. 영문/기호는 시스템에 이미 있는 DejaVu Sans Mono / Liberation Mono를 사용한다.

## 참고

`ebook/`(전자책 생성기)와 구조가 동일하다(빌드 스크립트 → render.js → PDF). 앱 코드가 바뀌면 이 폴더는 다시 `python3 build.py && node render.js`만 실행하면 최신 코드로 갱신된다.
