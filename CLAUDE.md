@AGENTS.md

# Polly — 프로젝트 노트

점수 기반 사내 예측 베팅(파리뮤추얼) · 멀티테넌트 웹앱. 자세한 개요는 `README.md`.

## 구조
- `lib/parimutuel.ts` — 정산 순수 함수(단위 테스트 `lib/parimutuel.test.ts`). 점수 보존 보장.
- `lib/db.ts` — Prisma 7 클라이언트(better-sqlite3 어댑터). 운영 전환 시 어댑터만 교체.
- `lib/auth.ts` — jose 서명 쿠키 세션(멤버/조직관리자/슈퍼관리자). 멤버는 조직별 쿠키 `polly_m_<orgId>`.
- `lib/keys.ts` — 키 해싱·초대코드/관리자키 생성(next/headers 비의존).
- `lib/data.ts` — 읽기 쿼리, `lib/validation.ts` — zod 스키마, `lib/constants.ts` — 상태/유형 상수(enum 미사용).
- `lib/actions/*.ts` — Server Actions (`auth`, `orgs`, `markets`, `social`).
- `app/[orgSlug]/...` — 조직 스코프 페이지, `app/admin` — 슈퍼관리자.
- `components/` — UI(서버) + `components/forms/`(클라이언트, useActionState).

## 규칙
- SQLite는 enum 미지원 → 상태/유형은 String + `lib/constants.ts` 상수.
- 베팅/정산은 트랜잭션으로 잔액·풀 동시 갱신. 정산은 멱등(이미 RESOLVED/VOID면 무시).
- 권한: 멤버=세션 쿠키, 조직관리자=`adminKey`, 슈퍼관리자=env `SUPER_ADMIN_KEY`(테이블 없음).
- 실시간은 `components/AutoRefresh.tsx` 폴링(기본 10초)으로 대체.
- 시크릿은 전부 env. `.env`는 커밋 금지(`.env.example`만).
