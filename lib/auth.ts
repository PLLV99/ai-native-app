import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { admin as adminPlugin, twoFactor } from "better-auth/plugins";
import { ac, admin, manager, user } from "@/lib/permissions";
import nodemailer from "nodemailer";

// สร้าง SMTP transporter สำหรับ Gmail
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  // เติมตรงนี้เพื่อแก้ Error ใน Dev และคงความปลอดภัยตอนขึ้น Production
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // เพิ่มส่วน Reset Password ตรงนี้
    sendResetPassword: async ({ user, url }) => {
      await transporter.sendMail({
        from: `"AI Native App" <${process.env.GMAIL_USER}>`,
        to: user.email,
        subject: "Reset Password - AI Native App",
        html: `
                    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                        <h1 style="color: #7c3aed; font-size: 24px;">Reset Password</h1>
                        <p>Hello ${user.name},</p>
                        <p>We received a request to reset your password. Click the button below to set a new password:</p>
                        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">
                            Set New Password
                        </a>
                        <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
                        <p style="color: #9ca3af; font-size: 12px;">If you didn't request this, please ignore this email.</p>
                    </div>
                `,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await transporter.sendMail({
        from: `"AI Native App" <${process.env.GMAIL_USER}>`,
        to: user.email,
        subject: "Verify your email - AI Native App",
        html: `
                    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                        <h1 style="color: #7c3aed; font-size: 24px;">Verify Email</h1>
                        <p>Hello ${user.name},</p>
                        <p>Click the button below to verify your email:</p>
                        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">
                            Verify Email
                        </a>
                        <p style="color: #9ca3af; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
                    </div>
                `,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    line: {
      clientId: process.env.LINE_CLIENT_ID as string,
      clientSecret: process.env.LINE_CLIENT_SECRET as string,
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github", "line", "facebook"],
    },
  },
  appName: "AI Native App",
  plugins: [
    adminPlugin({
      ac,
      roles: { admin, manager, user },
    }),
    twoFactor({
      issuer: "AI Native App",
      skipVerificationOnEnable: false,
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
});
