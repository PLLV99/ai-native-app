# =============================================
# Stage 1: Base — shared Alpine + pnpm
# =============================================
FROM docker.io/node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# pin pnpm ให้ตรงกับเครื่อง dev — corepack เลือกเวอร์ชันเองอาจได้ตัวที่อ่าน
# allowBuilds ใน pnpm-workspace.yaml ไม่ออก
RUN npm install -g pnpm@11.14.0 && \
    apk add --no-cache libc6-compat

# =============================================
# Stage 2: Dependencies — install once, cleanly
# =============================================
FROM base AS deps
WORKDIR /app

# pnpm-workspace.yaml มี allowBuilds อนุมัติ build scripts ของ
# @prisma/engines / prisma / sharp / unrs-resolver ไว้แล้ว
# → install ทีเดียวจบ ไม่ต้องใช้ pnpm approve-builds (ตัวนั้นเป็น TUI โต้ตอบ
#   ใน pnpm 11 จะทำให้ build ค้างรอคนกดตลอดกาล)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile

# =============================================
# Stage 3: Build — compile Next.js
# =============================================
FROM base AS builder
WORKDIR /app

# 1) Copy dependencies และ package.json (จำเป็นสำหรับ prisma)
COPY --from=deps /app/node_modules ./node_modules
# ต้องมี pnpm-workspace.yaml + lockfile ด้วย ไม่ใช่แค่ package.json —
# `pnpm prisma generate` จะเช็คสถานะ dependency ก่อนรัน ถ้าไม่เจอ allowBuilds
# มันจะสั่ง install ใหม่แล้วล้มด้วย ERR_PNPM_IGNORED_BUILDS
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 2) Copy prisma schema แล้ว generate client
COPY prisma ./prisma
RUN pnpm prisma generate

# 3) ตั้ง build-time env ก่อน copy source
ARG NEXT_PUBLIC_BETTER_AUTH_URL
ENV NEXT_PUBLIC_BETTER_AUTH_URL=$NEXT_PUBLIC_BETTER_AUTH_URL

# BETTER_AUTH_SECRET ไม่ควร bake ใน image
ENV BETTER_AUTH_SECRET="build-time-placeholder"
ENV BETTER_AUTH_URL=$NEXT_PUBLIC_BETTER_AUTH_URL

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV STANDALONE_BUILD=true

# 4) Copy source code
COPY . .

# 5) Build Next.js
RUN pnpm build

# =============================================
# Stage 4: Runner — minimal production image
# =============================================
FROM docker.io/node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# ติดตั้ง Prisma CLI สำหรับรัน sync schema ใน production
# (7.8.0 ให้ตรงกับ devDependency ใน package.json — ของจาร pin 7.5.0)
RUN npm install -g prisma@7.8.0

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Standalone output: เฉพาะไฟล์ที่จำเป็น
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma: copy schema + custom generated client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/app/generated/prisma ./app/generated/prisma

# Copy entrypoint (Ensure LF line endings)
COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
