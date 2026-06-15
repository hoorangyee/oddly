# Polly 🎲

점수로 즐기는 **사내 예측 베팅 · 랭킹** 서비스. 실제 돈은 걸지 않고, 점수(포인트)로
폴리마켓처럼 주제(마켓)에 베팅하고 잘 맞춘 사람이 리더보드 위로 올라갑니다.

- **파리뮤추얼(pool) 방식** — 여러 결과에 모인 점수 풀을 맞춘 사람들이 비율대로 나눠 가짐. 베팅이 모일수록 확률(%)이 실시간으로 움직임.
- **멀티테넌트** — 하나의 인스턴스에서 여러 조직이 격리되어 사용. 각 조직은 마켓·멤버·리더보드가 독립.
- **닉네임만으로 참여** — 멤버는 초대 코드 + 닉네임으로 입장(비밀번호 없음). 관리자만 비밀키로 권한 행사.

## 역할

| 역할 | 인증 | 권한 |
|------|------|------|
| 멤버 | 조직 초대 코드 + 닉네임 | 마켓 생성, 베팅, 댓글/반응 |
| 조직 관리자 | 조직 `adminKey` | 결과 확정/무효, 시즌 리셋 |
| 슈퍼관리자 | env `SUPER_ADMIN_KEY` | 조직 생성/삭제(인스턴스 운영자) |

## 빠른 시작 (로컬)

```bash
npm install
cp .env.example .env        # 값 채우기 (아래 참고)
npx prisma migrate dev      # DB 생성 + 마이그레이션
npm run db:seed             # 데모 조직/마켓/멤버 시드 (선택)
npm run dev                 # http://localhost:3000
```

`db:seed` 를 실행하면 데모 조직 정보(초대 코드, 관리자 키)가 콘솔에 출력됩니다.
브라우저에서 `http://localhost:3000/demo` 로 접속해 둘러보세요.

### 환경 변수 (`.env`)

```bash
DATABASE_URL="file:./dev.db"          # 개발: SQLite / 운영: postgresql://...
SESSION_SECRET="..."                  # 세션 쿠키 서명 (32바이트 hex 권장)
SUPER_ADMIN_KEY="..."                 # 슈퍼관리자 키 = 인스턴스 운영자
```

`SESSION_SECRET` 생성: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## 사용 흐름

1. `/admin` 에서 슈퍼관리자 키로 로그인 → 조직 생성 (초대 코드 + 관리자 키 발급, **1회만 표시**).
2. 멤버는 `/{slug}/join?invite=CODE` 로 닉네임 입장 → 시작 점수 지급.
3. 누구나 `/{slug}/markets/new` 에서 마켓 생성(예/아니오 또는 멀티초이스).
4. 마감 전까지 베팅 → 확률·배당이 풀 비율로 갱신.
5. 조직 관리자가 마켓 상세에서 **승리 결과 확정** → 자동 정산(풀을 승자에게 비율 분배).
6. `/{slug}/leaderboard` 에서 보유 점수 순위 확인. 시즌 리셋으로 새 시즌 시작.

## 점수 / 정산

- 모든 멤버는 동일 시작 점수로 시작, 추가 지급 없음. 리더보드는 **보유 점수(=시작점 대비 누적 손익)** 순.
- 정산: 승리 결과 `W`, 총 풀 `T`, `W` 풀 `P_W` 일 때 승자 환급 `= floor(stake / P_W × T)`.
  반올림 잔여는 최대 잔여 방식으로 분배되어 **총 풀이 정확히 보존**됨.
- 승리 풀이 비어 있으면 전원 환불(무효). 관리자가 무효 처리해도 전원 환불.

## 기술 스택

- **Next.js 16 (App Router) + TypeScript** · Server Actions · Tailwind CSS v4
- **Prisma 7 + SQLite**(개발) — 운영은 `schema.prisma` provider 와 `DATABASE_URL` 을 PostgreSQL 로 교체, `lib/db.ts` 의 어댑터를 `@prisma/adapter-pg` 로 변경
- 세션: `jose` 서명 쿠키 (비밀번호 없음)
- 정산 로직: `lib/parimutuel.ts` (순수 함수, Vitest 단위 테스트)

## 스크립트

```bash
npm run dev        # 개발 서버
npm run build      # 프로덕션 빌드
npm test           # 단위 테스트 (정산 로직)
npm run db:seed    # 데모 데이터 시드
npm run db:reset   # DB 초기화(마이그레이션 재적용)
```

## 배포 (운영, 멀티테넌트)

1. PostgreSQL 준비(Neon/Supabase 등) → `DATABASE_URL` 설정.
2. `prisma/schema.prisma` 의 `datasource db { provider = "postgresql" }` 로 변경.
3. `lib/db.ts` 의 SQLite 어댑터를 Postgres 어댑터(`@prisma/adapter-pg`)로 교체.
4. `SESSION_SECRET`, `SUPER_ADMIN_KEY` 를 안전한 값으로 설정(레포에 커밋 금지).
5. Vercel 등에 배포. 슈퍼관리자 키를 아는 사람만 조직을 만들 수 있습니다.

## 라이선스

MIT — [LICENSE](./LICENSE) 참고.
