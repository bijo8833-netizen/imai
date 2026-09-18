# -*- coding: utf-8 -*-
"""
경정청구·정부지원금 쉬운 가이드북 생성기
- 이 파일을 실행하면 ebook.html이 만들어진다. render.js로 그 HTML을 PDF로 변환한다.
- 사용법은 이 폴더의 README.md 참고.
"""
import html as H

# ---------------------------------------------------------------------------
# 표지에 넣을 회사명과 기준일. 필요할 때 이 두 값만 바꾸면 된다.
# ---------------------------------------------------------------------------
COMPANY_NAME = "강남하이클래스파트너스"
UPDATED_NOTE = "2025년 세법개정(2026년 시행) 반영 · 2026-09-18 기준"


def esc(s):
    return H.escape(s)

CORP_ITEMS = [
    ("1", "감가상각비 과소계상액",
     "회사가 쓰는 기계나 차는 시간이 지나면 값어치가 떨어져요. 이걸 '감가상각비'라고 하고, 세금 낼 때 비용으로 인정받을 수 있어요. 그런데 이걸 깜빡 잊고 신고 안 했다면 손해예요.",
     "고정자산 대장 (기계·차량 목록, 구입 날짜, 가격이 적힌 서류)",
     "앱의 '법인세 경정청구' 탭에서 이 항목 체크박스를 누르고, 빠뜨린 금액을 입력해요."),
    ("2", "대손금 손금산입 누락액",
     "거래처가 망해서 돈을 못 받게 됐어요. 이런 '못 받는 돈'은 손해로 인정받아 세금을 줄일 수 있어요.",
     "소멸시효 완성 서류, 법원의 회생계획 인가 결정문 등 대손 증빙",
     "해당 금액을 확인해서 체크박스와 함께 입력해요."),
    ("3", "이월결손금 공제 누락액",
     "작년에 회사가 손해를 봤다면, 그 손해를 올해 이익에서 빼줄 수 있어요. 이걸 깜빡하고 신고 안 했을 수도 있어요.",
     "세무조정계산서 안의 이월결손금 조정명세서",
     "공제받지 못한 이월결손금 금액을 입력해요."),
    ("4", "세액공제 누락액",
     "연구를 하거나 투자를 하거나 사람을 더 뽑으면 나라에서 세금을 깎아줘요. 이걸 신청 안 했다면 다시 받을 수 있어요.",
     "연구인력개발비 명세서, 투자 증빙, 고용 증가 증빙",
     "누락된 공제 금액을 확인해서 입력해요."),
    ("5", "기업업무추진비 한도 재계산 차액",
     "회사가 손님 접대에 쓴 돈은 한도까지만 비용으로 인정돼요. 한도 계산이 틀렸다면 다시 계산해서 더 인정받을 수 있어요.",
     "접대비(기업업무추진비) 명세서",
     "재계산한 차액을 입력해요."),
    ("6", "퇴직급여충당금·퇴직연금 손금산입 누락액",
     "직원이 나중에 퇴직할 때 줄 돈을 미리 비용으로 인정받을 수 있어요. 신고를 놓쳤다면 다시 받을 수 있어요.",
     "퇴직급여충당금 명세서, 퇴직연금 가입 증빙",
     "누락된 금액을 입력해요."),
    ("7", "재고자산평가손실 누락액",
     "창고에 쌓인 물건 값이 떨어졌다면, 그 손해도 비용으로 인정받을 수 있어요.",
     "재고자산 평가 명세서",
     "반영 안 된 평가손실 금액을 입력해요."),
    ("8", "외화환산손실 반영 누락액",
     "외국 돈으로 거래한 게 있다면, 환율이 바뀌어서 손해를 볼 수 있어요. 이것도 비용으로 인정받아요.",
     "외화자산·부채 명세서, 결산일 환율 자료",
     "반영 안 된 손실 금액을 입력해요."),
    ("9", "가지급금 인정이자 과다계상 환원액",
     "회사 대표님이 회사 돈을 빌려 썼다면 이자를 계산해서 세금에 반영해요. 이 계산이 틀리게 너무 많이 잡혔다면 되돌려 받을 수 있어요.",
     "가지급금 관련 장부, 인정이자율 계산 자료",
     "과다 계상된 금액을 입력해요."),
    ("10", "기부금 한도초과 이월공제 누락액",
     "기부한 돈이 한도를 넘으면 다음 해에 넘겨서 공제받을 수 있어요. 이걸 깜빡했다면 다시 받을 수 있어요.",
     "기부금 명세서",
     "누락된 이월공제 금액을 입력해요."),
]

VAT_ITEMS = [
    ("1", "매입세금계산서 합산신고 누락분",
     "물건을 살 때 받은 세금계산서를 신고에서 빠뜨렸다면, 그 세금을 돌려받을 수 있어요.",
     "매입세금계산서, 부가세 신고서",
     "'부가가치세 경정청구' 탭에서 체크하고 금액을 입력해요."),
    ("2", "신용카드매출전표 등 수령분 매입세액",
     "카드나 현금영수증으로 산 것도 세금을 돌려받을 수 있어요. 신고에서 빠졌다면 챙겨야 해요.",
     "카드매출전표, 현금영수증 내역",
     "금액을 확인해서 입력해요."),
    ("3", "의제매입세액공제 누락·과소분",
     "농산물처럼 세금이 안 붙는 재료를 샀을 때도 일부 세금을 돌려받을 수 있는 제도예요.",
     "농산물 등 원재료 매입 증빙",
     "누락된 공제액을 입력해요."),
    ("4", "대손세액공제 누락분",
     "거래처가 돈을 안 줘서 못 받게 되면, 그때 냈던 부가세도 돌려받을 수 있어요.",
     "대손 확정 증빙",
     "금액을 입력해요."),
    ("5", "불공제매입세액 과다 반영 환원분",
     "세금을 못 돌려받는다고 잘못 분류된 게 있다면, 다시 확인해서 돌려받을 수 있어요.",
     "매입세액 불공제 명세서",
     "환원 가능 금액을 입력해요."),
    ("6", "영세율 매출 누락신고에 따른 재계산 차액",
     "수출처럼 세금이 0%인 매출을 빠뜨렸다면 다시 계산해서 차액을 돌려받을 수 있어요.",
     "수출 신고서, 영세율 매출 증빙",
     "재계산한 차액을 입력해요."),
]

CREDIT_ITEMS = [
    ("1", "창업중소기업(청년창업) 세액감면",
     "회사를 새로 차린 지 얼마 안 됐다면(보통 5년 이내), 세금을 최대 100%까지 깎아줘요. 특히 청년(만 34세 이하)이 지방에서 창업하면 더 많이 깎아줘요.",
     "사업자등록증, 법인등기부등본(설립일 확인), 대표자 신분증(나이 확인)",
     "'정부지원·세액감면 매칭' 탭에서 설립일, 대표자 나이, 소재지를 입력해요."),
    ("2", "중소기업 특별세액감면",
     "중소기업이면 업종과 지역에 따라 세금의 5~30%를 깎아줘요. 단, 조금 더 큰 '중기업'은 서울·인천·경기(수도권)에 있으면 이 혜택을 못 받아요. 작은 회사(소기업)는 수도권에 있어도 받을 수 있어요.",
     "법인세 산출세액 확인서(신고서)",
     "기업 규모, 업종, 소재지, 산출세액을 입력해요."),
    ("3", "통합투자세액공제",
     "회사가 기계나 설비를 새로 샀다면, 그 금액의 일부를 세금에서 빼줘요.",
     "고정자산 취득 명세서(구입 영수증, 세금계산서)",
     "올해 설비투자금액을 입력해요."),
    ("4", "연구인력개발비 세액공제",
     "연구개발(R&D)에 쓴 돈의 일부를 세금에서 빼줘요.",
     "연구인력개발비 명세서",
     "올해 R&D 지출액을 입력해요."),
    ("5", "통합고용세액공제",
     "직원을 새로 많이 뽑으면, 한 명당 정해진 금액을 세금에서 빼줘요. 청년이나 취약계층을 뽑으면 더 많이 깎아줘요.",
     "4대보험 취득상실 확인서, 급여대장",
     "올해 늘어난 직원 수(일반/우대)를 입력해요."),
    ("6", "성과공유 중소기업 경영성과급 세액공제",
     "직원들에게 성과급을 주면, 그 금액의 10%를 세금에서 빼줘요(2027년 12월 31일까지 지급분, 직전 연도보다 직원 수가 줄면 공제 안 돼요).",
     "성과급 지급 규정, 지급 대장",
     "올해 지급한 성과급 총액을 입력해요."),
]

GRANT_ITEMS = [
    ("1", "청년일자리도약장려금",
     "청년(15~34세)을 새로 뽑아서 6개월 이상 계속 일하게 하면, 나라에서 돈을 줘요(최대 1,200만원, 2년에 걸쳐).",
     "4대보험 취득 확인서, 근로계약서",
     "올해 청년 신규채용 인원을 입력해요."),
    ("2", "고용창출장려금",
     "새로운 일자리를 만들면(특정 유형에 해당하면) 나라에서 돈을 줘요.",
     "4대보험 취득상실 확인서",
     "올해 늘어난 직원 수를 입력해요."),
    ("3", "두루누리 사회보험료 지원",
     "직원이 10명보다 적은 작은 회사라면, 나라에서 4대보험료의 최대 80%를 대신 내줘요.",
     "사업장 가입자 명부(월급 270만원 미만 신규가입자 확인)",
     "상시근로자수와 두루누리 대상 인원을 입력해요."),
    ("4", "예비창업패키지",
     "아직 사업자등록을 안 한 '예비 창업자'에게 사업 준비 자금을 줘요(평균 4천만원).",
     "사업계획서",
     "'아직 사업자등록 전 예비창업자임'을 체크해요."),
    ("5", "초기창업패키지",
     "회사를 차린 지 3년이 안 됐다면 사업 자금을 지원해줘요(평균 7천만원).",
     "사업자등록증, 사업계획서",
     "설립일을 입력하면 앱이 자동으로 업력을 계산해요."),
    ("6", "창업도약패키지",
     "회사를 차린 지 3~7년 됐다면, 더 크게 성장하도록 자금을 지원해줘요.",
     "사업자등록증, 사업계획서, 최근 매출 자료",
     "설립일을 입력해요."),
    ("7", "중소기업 혁신바우처",
     "컨설팅이나 마케팅에 쓸 수 있는 '바우처(쿠폰)'를 최대 5천만원까지 줘요.",
     "사업자등록증",
     "기업 규모(소기업/중기업)를 입력해요."),
    ("8", "스마트공장 구축지원",
     "공장을 자동화·똑똑하게 만드는 비용을 나라가 절반 정도 지원해줘요(최대 1.5억원).",
     "제조업 사업자등록증, 공장 현황 자료",
     "'제조업을 영위함'을 체크해요."),
]

CHECKLIST = [
    ("경정청구 (공통)", "법인세 세무조정계산서, 법인세 신고서, 부가가치세 신고서"),
    ("법인세 항목용", "고정자산 대장, 퇴직급여충당금 명세서, 접대비 명세서, 대손 증빙, 이월결손금 명세"),
    ("부가가치세 항목용", "매입·매출 세금계산서 합계표, 카드매출전표, 대손 증빙"),
    ("세액공제·감면용", "법인세 산출세액 확인서, 고정자산 취득명세, 연구인력개발비 명세서, 급여대장"),
    ("정부지원 보조금용", "4대보험 취득상실확인서, 사업자등록증, 사업계획서"),
]

def card(num, title, desc, docs, howto, color):
    return f"""
    <div class="card" style="--accent:{color};">
      <div class="card-num">{esc(num)}</div>
      <div class="card-body">
        <h3>{esc(title)}</h3>
        <div class="row explain"><span class="tag">🙂 쉬운 설명</span><p>{esc(desc)}</p></div>
        <div class="row docs"><span class="tag">📄 준비서류</span><p>{esc(docs)}</p></div>
        <div class="row howto"><span class="tag">⌨️ 입력 방법</span><p>{esc(howto)}</p></div>
      </div>
    </div>"""

def chapter(num, title, subtitle, color, items_html, icon):
    return f"""
    <section class="chapter" style="--chapter-color:{color};">
      <div class="chapter-head">
        <div class="chapter-badge">{esc(num)}</div>
        <div>
          <div class="chapter-icon">{icon}</div>
          <h2>{esc(title)}</h2>
          <p class="subtitle">{esc(subtitle)}</p>
        </div>
      </div>
      {items_html}
    </section>"""

corp_cards = "".join(card(n, t, d, doc, h, "#2f6fed") for n, t, d, doc, h in CORP_ITEMS)
vat_cards = "".join(card(n, t, d, doc, h, "#26a65b") for n, t, d, doc, h in VAT_ITEMS)
credit_cards = "".join(card(n, t, d, doc, h, "#ff9f43") for n, t, d, doc, h in CREDIT_ITEMS)
grant_cards = "".join(card(n, t, d, doc, h, "#ff6b81") for n, t, d, doc, h in GRANT_ITEMS)

checklist_rows = "".join(
    f"<tr><td class='ck-cat'>{esc(cat)}</td><td>{esc(docs)}</td></tr>" for cat, docs in CHECKLIST
)

HTML = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>경정청구·정부지원금 쉬운 가이드북 - {esc(COMPANY_NAME)}</title>
<style>
@font-face {{
  font-family: 'Noto Sans KR';
  font-weight: 400;
  src: url('fonts/NotoSansKR-400.woff2') format('woff2');
}}
@font-face {{
  font-family: 'Noto Sans KR';
  font-weight: 500;
  src: url('fonts/NotoSansKR-500.woff2') format('woff2');
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
  --paper: #ffffff;
}}

* {{ box-sizing: border-box; }}

html, body {{
  margin: 0; padding: 0;
  font-family: 'Noto Sans KR', sans-serif;
  color: var(--text);
  background: var(--bg);
  font-size: 13px;
  line-height: 1.65;
}}

@page {{
  size: A4;
  margin: 18mm 16mm 20mm 16mm;
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
  background: linear-gradient(160deg, #2f6fed 0%, #6fa4ff 55%, #ffd166 100%);
  border-radius: 24px;
  color: white;
  page-break-after: always;
  page-break-inside: avoid;
  break-inside: avoid;
  overflow: hidden;
  padding: 16mm;
}}
.cover .cover-art {{ width: 190px; height: 190px; margin-bottom: 8px; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.18)); }}
.cover .company-badge {{
  display: inline-block;
  background: rgba(255,255,255,0.25);
  border: 1.5px solid rgba(255,255,255,0.6);
  border-radius: 999px;
  padding: 6px 20px;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 16px;
  letter-spacing: 0.3px;
}}
.cover h1 {{
  font-size: 34px;
  font-weight: 900;
  margin: 0 0 14px;
  line-height: 1.35;
  text-shadow: 0 2px 0 rgba(0,0,0,0.08);
}}
.cover .sub {{
  font-size: 15px;
  font-weight: 500;
  max-width: 120mm;
  opacity: 0.95;
}}
.cover .footer-note {{
  margin-top: 40px;
  font-size: 12px;
  background: rgba(255,255,255,0.2);
  padding: 8px 18px;
  border-radius: 999px;
}}

/* ---------- Intro ---------- */
.intro {{
  page-break-after: always;
}}
.intro h2 {{
  font-size: 22px;
  color: #2f6fed;
}}
.intro .bubble {{
  background: #eef4ff;
  border: 2px solid #cfe0ff;
  border-radius: 16px;
  padding: 16px 20px;
  margin: 14px 0;
  font-size: 13.5px;
}}
.intro ul {{ padding-left: 20px; }}
.intro .deadline {{
  background: #fff4e0;
  border: 2px dashed #ffb443;
  border-radius: 14px;
  padding: 12px 18px;
  font-weight: 700;
  color: #a05b00;
  margin-top: 10px;
}}

/* ---------- Chapters ---------- */
.chapter {{
  page-break-before: always;
}}
.chapter-head {{
  display: flex;
  align-items: flex-start;
  gap: 14px;
  border-bottom: 4px solid var(--chapter-color);
  padding-bottom: 12px;
  margin-bottom: 18px;
}}
.chapter-badge {{
  flex: 0 0 auto;
  width: 40px; height: 40px;
  background: var(--chapter-color);
  color: white;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 900;
  font-size: 17px;
}}
.chapter-icon {{ font-size: 22px; }}
.chapter h2 {{
  margin: 2px 0 4px;
  font-size: 20px;
  color: var(--chapter-color);
}}
.chapter .subtitle {{
  margin: 0;
  color: var(--muted);
  font-size: 12.5px;
}}

/* ---------- Cards ---------- */
.card {{
  display: flex;
  gap: 12px;
  background: var(--paper);
  border: 1.5px solid #ececec;
  border-left: 6px solid var(--accent);
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 12px;
  page-break-inside: avoid;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}}
.card-num {{
  flex: 0 0 auto;
  width: 26px; height: 26px;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  font-weight: 800;
  font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  margin-top: 2px;
}}
.card h3 {{
  margin: 0 0 8px;
  font-size: 14.5px;
}}
.card .row {{
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
  align-items: flex-start;
}}
.card .row:last-child {{ margin-bottom: 0; }}
.card .tag {{
  flex: 0 0 auto;
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
  margin-top: 1px;
}}
.card .explain .tag {{ background: #eef4ff; color: #2f6fed; }}
.card .docs .tag {{ background: #fff1e0; color: #b5610a; }}
.card .howto .tag {{ background: #e9fbf1; color: #1a8f56; }}
.card p {{ margin: 0; font-size: 12.5px; }}

/* ---------- App usage steps ---------- */
.steps {{
  counter-reset: step;
  list-style: none;
  padding: 0;
}}
.steps li {{
  counter-increment: step;
  position: relative;
  padding: 10px 14px 10px 44px;
  margin-bottom: 10px;
  background: #f6f8ff;
  border-radius: 12px;
  font-size: 13px;
}}
.steps li::before {{
  content: counter(step);
  position: absolute;
  left: 10px; top: 8px;
  width: 22px; height: 22px;
  background: #2f6fed;
  color: white;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800;
  font-size: 12px;
}}
.tip {{
  background: #fff9e0;
  border: 2px dashed #ffd166;
  border-radius: 12px;
  padding: 10px 16px;
  margin-top: 12px;
  font-size: 12.5px;
}}

/* ---------- Checklist table ---------- */
table.checklist {{
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  font-size: 12px;
}}
table.checklist th {{
  background: #2f6fed;
  color: white;
  padding: 8px 10px;
  text-align: left;
}}
table.checklist td {{
  padding: 9px 10px;
  border-bottom: 1px solid #eee;
  vertical-align: top;
}}
table.checklist tr:nth-child(even) td {{ background: #f7f9ff; }}
.ck-cat {{ font-weight: 700; color: #2f6fed; white-space: nowrap; }}
.must {{
  background: #fff0f0;
  border: 2px solid #ffc2c2;
  border-radius: 14px;
  padding: 12px 18px;
  margin-top: 14px;
  font-size: 13px;
}}
.must b {{ color: #d1435b; }}

/* ---------- Ending ---------- */
.ending {{
  page-break-before: always;
  text-align: center;
  padding-top: 40mm;
}}
.ending .big-emoji {{ font-size: 56px; }}
.ending h2 {{ color: #2f6fed; font-size: 22px; }}
.ending .note {{
  max-width: 110mm;
  margin: 16px auto;
  background: #eef4ff;
  border-radius: 16px;
  padding: 18px 22px;
  font-size: 13.5px;
}}
</style>
</head>
<body>

<div class="cover">
  <div class="company-badge">{esc(COMPANY_NAME)}</div>
  <svg class="cover-art" viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg">
    <circle cx="130" cy="130" r="122" fill="#ffffff"/>
    <circle cx="130" cy="130" r="122" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="6"/>
    <!-- government building -->
    <g transform="translate(93,34)">
      <polygon points="37,0 74,24 0,24" fill="#2f6fed"/>
      <rect x="3" y="24" width="9" height="34" fill="#2f6fed"/>
      <rect x="19" y="24" width="9" height="34" fill="#2f6fed"/>
      <rect x="35" y="24" width="9" height="34" fill="#2f6fed"/>
      <rect x="51" y="24" width="9" height="34" fill="#2f6fed"/>
      <rect x="65" y="24" width="9" height="34" fill="#2f6fed"/>
      <rect x="-4" y="58" width="82" height="9" rx="2" fill="#2f6fed"/>
    </g>
    <!-- document -->
    <g transform="translate(52,108) rotate(-7)">
      <rect x="0" y="0" width="92" height="118" rx="12" fill="#ffffff" stroke="#d7e2ff" stroke-width="4"/>
      <rect x="16" y="22" width="60" height="9" rx="4.5" fill="#c7d7ff"/>
      <rect x="16" y="41" width="60" height="9" rx="4.5" fill="#c7d7ff"/>
      <rect x="16" y="60" width="40" height="9" rx="4.5" fill="#c7d7ff"/>
      <rect x="16" y="84" width="46" height="13" rx="6.5" fill="#ff9f43"/>
    </g>
    <!-- coin stack -->
    <g transform="translate(158,168)">
      <ellipse cx="0" cy="30" rx="38" ry="13" fill="#e8960f"/>
      <ellipse cx="0" cy="17" rx="38" ry="13" fill="#ffb43d"/>
      <ellipse cx="0" cy="4" rx="38" ry="13" fill="#ffcf66"/>
      <ellipse cx="0" cy="-7" rx="38" ry="15" fill="#ffe28a" stroke="#e8960f" stroke-width="2.5"/>
      <path d="M -10 -9 Q 0 -21 10 -9" stroke="#c9820a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </g>
    <!-- checkmark stamp -->
    <g transform="translate(152,84)">
      <circle cx="0" cy="0" r="29" fill="#26c281" stroke="#ffffff" stroke-width="5"/>
      <path d="M -12 0 L -3 10 L 14 -11" stroke="white" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>
  <h1>경정청구 · 정부지원금<br>쉬운 가이드북</h1>
  <p class="sub">초등학생도 이해할 수 있도록<br>아주 쉽게 설명한 세금 이야기</p>
  <div class="footer-note">항목별 준비서류 · 앱 입력 방법 총정리</div>
  <p style="margin-top:14px; font-size:11px; opacity:0.85;">{esc(UPDATED_NOTE)}</p>
</div>

<div class="intro">
  <h2>1장. 경정청구가 뭐예요?</h2>
  <div class="bubble">
    학교 시험에서 선생님이 채점을 실수해서 원래 90점인데 80점을 줬다고 해볼게요.
    그러면 선생님께 "다시 채점해주세요!"라고 말할 수 있겠죠? 회사도 똑같아요.<br><br>
    회사가 세금을 신고할 때 실수로 세금을 더 많이 냈다면,
    "제가 세금을 더 냈어요, 돌려주세요!"라고 나라에 말할 수 있어요.
    이것을 <b>경정청구</b>라고 불러요.
  </div>
  <ul>
    <li><b>법인세</b>: 회사가 번 돈(이익)에 대해 내는 세금이에요.</li>
    <li><b>부가가치세</b>: 물건을 사고팔 때 붙는 세금이에요.</li>
  </ul>
  <p>두 가지 세금 모두 "혹시 실수로 더 낸 부분이 있는지" 확인해서 돌려받을 수 있어요.</p>
  <div class="deadline">⏰ 단, 세금을 처음 신고한 날로부터 5년 안에만 가능해요! 우유의 유통기한처럼, 경정청구에도 기한이 있어요.</div>
</div>

{chapter("2", "법인세에서 다시 받을 수 있는 10가지", "회사가 번 돈에 대한 세금, 빠뜨린 부분이 있는지 확인해요", "#2f6fed", corp_cards, "🏢")}

{chapter("3", "부가가치세에서 다시 받을 수 있는 6가지", "물건 사고팔 때 붙는 세금, 놓친 부분이 있는지 확인해요", "#26a65b", vat_cards, "🧾")}

<div class="intro" style="page-break-before: always;">
  <h2>4장. 나라에서 주는 돈이 뭐예요?</h2>
  <div class="bubble">
    나라에서 회사에 주는 돈은 크게 두 종류가 있어요.<br><br>
    🎟️ <b>세액공제·감면</b>은 "확정 할인쿠폰"이에요. 조건만 맞으면 무조건 깎아줘요.<br><br>
    🏆 <b>보조금(정부지원사업)</b>은 "대회 상금"과 같아요. 신청하고 심사를 통과해야 받을 수 있고, 떨어질 수도 있어요.
  </div>
  <p>다음 장에서 이 둘을 나눠서 설명해 드릴게요.</p>
</div>

{chapter("5", "확정으로 깎아주는 세금 6가지", "세액공제·감면 — 조건만 맞으면 무조건 깎아줘요", "#ff9f43", credit_cards, "🎟️")}

{chapter("6", "신청해서 받는 상금 8가지", "정부지원 보조금 — 심사를 통과해야 받을 수 있어요", "#ff6b81", grant_cards, "🏆")}

<div class="intro" style="page-break-before: always;">
  <h2>7장. 우리 앱 사용법</h2>
  <ol class="steps">
    <li>인터넷 브라우저에서 앱 화면(index.html)을 열어요.</li>
    <li>화면 위쪽의 탭 3개 중 하나를 골라요: "법인세 경정청구", "부가가치세 경정청구", "정부지원·세액감면 매칭"</li>
    <li>빈칸에 우리 회사 정보를 입력해요. (숫자만 넣으면 돼요, 콤마는 안 써도 돼요)</li>
    <li>해당하는 항목에 체크하고 금액을 입력해요.</li>
    <li>맨 아래 파란 버튼을 눌러요.</li>
    <li>화면 아래에 예상 금액과 표가 나와요. 그걸 보고 세무사 선생님과 상의하세요!</li>
  </ol>
  <div class="tip">💡 팁! 값을 잘못 넣었다면 그냥 지우고 다시 쓰면 돼요. 저장 버튼이 따로 없어서 버튼을 누를 때마다 새로 계산해줘요.</div>
</div>

<div class="intro" style="page-break-before: always;">
  <h2>8장. 준비서류 체크리스트 총정리</h2>
  <table class="checklist">
    <thead><tr><th style="width:28%;">구분</th><th>준비서류</th></tr></thead>
    <tbody>
      {checklist_rows}
    </tbody>
  </table>
  <div class="must">가장 먼저 챙겨야 할 것 딱 두 가지만 기억하세요: <b>법인세 신고서</b>와 <b>급여대장</b>이에요. 이 둘만 있어도 가장 많은 항목을 확인할 수 있어요.</div>
</div>

<div class="ending">
  <div class="big-emoji">🎉</div>
  <h2>수고하셨어요!</h2>
  <div class="note">
    이 책과 앱은 어려운 세금 이야기를 쉽게 이해하도록 도와주는 "친구"예요.
    하지만 진짜로 세금을 돌려받거나 지원금을 신청할 때는 꼭 <b>세무사 선생님</b>과 함께 확인하세요.
    숫자 하나만 틀려도 결과가 달라질 수 있거든요!<br><br>
    이제 우리 회사에 어떤 혜택이 있는지 한눈에 알 수 있겠죠?
  </div>
</div>

</body>
</html>
"""

with open("ebook.html", "w", encoding="utf-8") as f:
    f.write(HTML)

print("wrote ebook.html", len(HTML), "chars")
