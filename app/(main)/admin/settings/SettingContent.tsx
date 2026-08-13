"use client"

import { useState, useSyncExternalStore } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { themeStore } from "@/lib/theme-store"
import {
  Settings,
  Sun,
  Moon,
  Monitor,
  Key,
  Database,
  Bot,
  Mail,
  Shield,
  Globe,
  Bell,
  Save,
  CheckCircle2,
  Loader2,
  Info,
  ExternalLink,
  Palette,
  Server,
  Zap,
} from "lucide-react"

// Tab types
type SettingsTab = "general" | "appearance" | "ai" | "auth" | "email" | "database" | "notifications"

interface TabItem {
  id: SettingsTab
  label: string
  icon: typeof Settings
  description: string
}

const TABS: TabItem[] = [
  { id: "general", label: "General", icon: Settings, description: "Basic application settings" },
  { id: "appearance", label: "Theme & Display", icon: Palette, description: "Adjust the theme and display style" },
  { id: "ai", label: "AI & Models", icon: Bot, description: "Configure OpenAI and the RAG system" },
  { id: "auth", label: "Authentication", icon: Shield, description: "OAuth providers and 2FA" },
  { id: "email", label: "Email (SMTP)", icon: Mail, description: "Outgoing email settings" },
  { id: "database", label: "Database", icon: Database, description: "PostgreSQL & pgVector" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Manage notifications" },
]

// Theme options
type ThemeMode = "light" | "dark" | "system"

export default function SettingContent() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Theme
  const isDark = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot
  )
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    isDark ? "dark" : "light"
  )

  // General
  const [appName, setAppName] = useState("AI Native App")
  const [appDescription, setAppDescription] = useState(
    "AI chatbot management system with a knowledge base for Smart Electronic Thailand"
  )
  const [language, setLanguage] = useState("en")

  // AI
  const [chatModel, setChatModel] = useState("gpt-4o-mini")
  const [embeddingModel, setEmbeddingModel] = useState("text-embedding-3-small")
  const [maxTokens, setMaxTokens] = useState(2048)
  const [temperature, setTemperature] = useState(0.7)
  const [topK, setTopK] = useState(5)

  // SMTP
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com")
  const [smtpPort, setSmtpPort] = useState(465)
  const [smtpUser, setSmtpUser] = useState("")
  const [smtpSecure, setSmtpSecure] = useState(true)

  // Notifications
  const [notifyNewUser, setNotifyNewUser] = useState(true)
  const [notifyDocIndexed, setNotifyDocIndexed] = useState(true)
  const [notifyErrors, setNotifyErrors] = useState(true)
  const [notifyChatReport, setNotifyChatReport] = useState(false)

  function handleThemeChange(mode: ThemeMode) {
    setThemeMode(mode)
    if (mode === "dark") {
      themeStore.setTheme(true)
    } else if (mode === "light") {
      themeStore.setTheme(false)
    } else {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      themeStore.setTheme(systemDark)
    }
  }

  function handleSave() {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 800)
  }

  const activeTabInfo = TABS.find((t) => t.id === activeTab)!

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Settings</h2>
          <p className="text-muted-foreground mt-1">Manage all system settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 shrink-0">
          <nav className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* Section Header */}
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <activeTabInfo.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              {activeTabInfo.label}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">{activeTabInfo.description}</p>
          </div>

          {/* ==================== General ==================== */}
          {activeTab === "general" && (
            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Application Info</CardTitle>
                  <CardDescription>Set the app name and basic details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SettingField label="App Name">
                    <input
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      className="setting-input"
                    />
                  </SettingField>
                  <SettingField label="Description">
                    <textarea
                      rows={3}
                      value={appDescription}
                      onChange={(e) => setAppDescription(e.target.value)}
                      className="setting-input resize-none"
                    />
                  </SettingField>
                  <SettingField label="Primary Language">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="setting-input"
                    >
                      <option value="en">English (EN)</option>
                      <option value="th">Thai (TH)</option>
                    </select>
                  </SettingField>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Version Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <InfoPill label="Next.js" value="16.1.6" />
                    <InfoPill label="React" value="19.x" />
                    <InfoPill label="Prisma" value="7.4.1" />
                    <InfoPill label="better-auth" value="latest" />
                    <InfoPill label="TypeScript" value="5.x" />
                    <InfoPill label="Node.js" value="v20+" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================== Appearance ==================== */}
          {activeTab === "appearance" && (
            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Theme</CardTitle>
                  <CardDescription>Choose your preferred display mode</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { mode: "light" as ThemeMode, label: "Light", icon: Sun, desc: "Always light mode" },
                      { mode: "dark" as ThemeMode, label: "Dark", icon: Moon, desc: "Always dark mode" },
                      { mode: "system" as ThemeMode, label: "System", icon: Monitor, desc: "Follow device setting" },
                    ].map(({ mode, label, icon: Icon, desc }) => (
                      <button
                        key={mode}
                        onClick={() => handleThemeChange(mode)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${
                          themeMode === mode
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <div
                          className={`p-3 rounded-lg ${
                            themeMode === mode
                              ? "bg-blue-100 dark:bg-blue-800/40"
                              : "bg-gray-100 dark:bg-gray-700"
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 ${
                              themeMode === mode ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                            }`}
                          />
                        </div>
                        <span className={`text-sm font-medium ${themeMode === mode ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}>
                          {label}
                        </span>
                        <span className="text-xs text-muted-foreground">{desc}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Current Theme Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    {isDark ? (
                      <Moon className="h-5 w-5 text-indigo-500" />
                    ) : (
                      <Sun className="h-5 w-5 text-amber-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {isDark ? "Dark Mode" : "Light Mode"} — currently active
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stored value: {typeof window !== "undefined" ? localStorage.getItem("theme") || "not set" : "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================== AI & Model ==================== */}
          {activeTab === "ai" && (
            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">OpenAI Configuration</CardTitle>
                  <CardDescription>Configure the AI models used for chat and embedding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SettingField label="API Key">
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="password"
                        value="sk-••••••••••••••••"
                        readOnly
                        className="setting-input has-icon"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Set via the environment variable: OPENAI_API_KEY
                    </p>
                  </SettingField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <SettingField label="Chat Model">
                      <select value={chatModel} onChange={(e) => setChatModel(e.target.value)} className="setting-input">
                        <option value="gpt-4o-mini">GPT-4o Mini</option>
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </select>
                    </SettingField>
                    <SettingField label="Embedding Model">
                      <select value={embeddingModel} onChange={(e) => setEmbeddingModel(e.target.value)} className="setting-input">
                        <option value="text-embedding-3-small">text-embedding-3-small</option>
                        <option value="text-embedding-3-large">text-embedding-3-large</option>
                        <option value="text-embedding-ada-002">text-embedding-ada-002</option>
                      </select>
                    </SettingField>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">RAG & Generation Parameters</CardTitle>
                  <CardDescription>Tune the answer generation parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <SettingField label={`Temperature: ${temperature}`}>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0 (precise)</span>
                      <span>2 (creative)</span>
                    </div>
                  </SettingField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <SettingField label="Max Tokens">
                      <input
                        type="number"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                        className="setting-input"
                        min={256}
                        max={8192}
                      />
                    </SettingField>
                    <SettingField label="Top K (Vector Search)">
                      <input
                        type="number"
                        value={topK}
                        onChange={(e) => setTopK(parseInt(e.target.value))}
                        className="setting-input"
                        min={1}
                        max={20}
                      />
                    </SettingField>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================== Auth ==================== */}
          {activeTab === "auth" && (
            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Social OAuth Providers</CardTitle>
                  <CardDescription>Status of connected OAuth providers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { name: "Google", connected: true, color: "text-red-500" },
                      { name: "GitHub", connected: true, color: "text-gray-900 dark:text-white" },
                      { name: "LINE", connected: true, color: "text-green-500" },
                      { name: "Facebook", connected: true, color: "text-blue-600" },
                    ].map((provider) => (
                      <div
                        key={provider.name}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <Globe className={`h-5 w-5 ${provider.color}`} />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{provider.name}</span>
                        </div>
                        <StatusBadge active={provider.connected} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication (2FA)</p>
                      <p className="text-xs text-muted-foreground">Require users to confirm a TOTP code at sign-in</p>
                    </div>
                    <StatusBadge active={true} label="Supported" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Account Linking</p>
                      <p className="text-xs text-muted-foreground">Link accounts automatically when emails match</p>
                    </div>
                    <StatusBadge active={true} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoPill label="Session Expiry" value="7 days" />
                    <InfoPill label="Update Age" value="1 day" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Roles & Permissions</CardTitle>
                  <CardDescription>The RBAC roles defined in this system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { role: "Admin", perms: "Full CRUD + user and session management", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
                      { role: "Manager", perms: "Create, read and update projects", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
                      { role: "User", perms: "Create and read projects", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
                    ].map((r) => (
                      <div key={r.role} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${r.color}`}>{r.role}</span>
                        <span className="text-sm text-muted-foreground">{r.perms}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================== Email/SMTP ==================== */}
          {activeTab === "email" && (
            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">SMTP Configuration</CardTitle>
                  <CardDescription>Settings for verification and password-reset emails</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SettingField label="SMTP Host">
                      <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="setting-input" />
                    </SettingField>
                    <SettingField label="SMTP Port">
                      <input type="number" value={smtpPort} onChange={(e) => setSmtpPort(parseInt(e.target.value))} className="setting-input" />
                    </SettingField>
                  </div>
                  <SettingField label="Sender (Gmail)">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="email"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        className="setting-input has-icon"
                        placeholder="your@gmail.com"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Set via GMAIL_USER & GMAIL_APP_PASSWORD
                    </p>
                  </SettingField>
                  <ToggleRow
                    label="SSL/TLS"
                    description="Enable a secure connection"
                    checked={smtpSecure}
                    onChange={setSmtpSecure}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Email Templates</CardTitle>
                  <CardDescription>Emails the system sends automatically</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { name: "Email Verification", desc: "Sent when a new user signs up", icon: Mail },
                      { name: "Password Reset", desc: "Sent when a password reset is requested", icon: Key },
                    ].map((tpl) => (
                      <div key={tpl.name} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <tpl.icon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{tpl.name}</p>
                            <p className="text-xs text-muted-foreground">{tpl.desc}</p>
                          </div>
                        </div>
                        <StatusBadge active={true} label="Active" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================== Database ==================== */}
          {activeTab === "database" && (
            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">PostgreSQL (Neon)</CardTitle>
                  <CardDescription>Primary database status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoPill label="Provider" value="Neon PostgreSQL" />
                    <InfoPill label="ORM" value="Prisma 7.4.1" />
                    <InfoPill label="Adapter" value="@prisma/adapter-pg" />
                    <InfoPill label="Extension" value="pgVector" />
                  </div>
                  <div className="mt-4 flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Connection Status</p>
                        <p className="text-xs text-muted-foreground">DATABASE_URL (env)</p>
                      </div>
                    </div>
                    <StatusBadge active={true} label="Connected" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Prisma Schema Models</CardTitle>
                  <CardDescription>Tables defined in this system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      "User",
                      "Session",
                      "Account",
                      "Verification",
                      "TwoFactor",
                      "ChatSession",
                      "ChatMessage",
                      "Document",
                      "DocumentChunk",
                    ].map((model) => (
                      <div key={model} className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                        <Database className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">{model}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Vector Database</CardTitle>
                  <CardDescription>pgVector for embedding search</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoPill label="Dimension" value="1536" />
                    <InfoPill label="Distance" value="Cosine (< = >)" />
                    <InfoPill label="Index" value="ivfflat / hnsw" />
                    <InfoPill label="Table" value="document_chunks" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================== Notifications ==================== */}
          {activeTab === "notifications" && (
            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Administrator Notifications</CardTitle>
                  <CardDescription>Choose which events you want to be notified about</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ToggleRow
                    label="New user sign-ups"
                    description="Get notified when a new user registers"
                    checked={notifyNewUser}
                    onChange={setNotifyNewUser}
                  />
                  <ToggleRow
                    label="Document indexed successfully"
                    description="Get notified when a knowledge base document finishes indexing"
                    checked={notifyDocIndexed}
                    onChange={setNotifyDocIndexed}
                  />
                  <ToggleRow
                    label="System errors"
                    description="Get notified when an API or AI service throws an error"
                    checked={notifyErrors}
                    onChange={setNotifyErrors}
                  />
                  <ToggleRow
                    label="Daily chat report"
                    description="A daily summary of conversation volume and top questions"
                    checked={notifyChatReport}
                    onChange={setNotifyChatReport}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Notification Channels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { channel: "Email", desc: "Sent to the admin email address", icon: Mail, active: true },
                      { channel: "LINE Notify", desc: "Sent via the LINE Messaging API", icon: Zap, active: false },
                      { channel: "Webhook", desc: "Sent to a custom URL", icon: ExternalLink, active: false },
                    ].map((ch) => (
                      <div key={ch.channel} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <ch.icon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{ch.channel}</p>
                            <p className="text-xs text-muted-foreground">{ch.desc}</p>
                          </div>
                        </div>
                        <StatusBadge active={ch.active} label={ch.active ? "On" : "Off"} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Inline styles for inputs (avoids repeating long Tailwind classes) */}
      <style>{`
        .setting-input {
          width: 100%;
          padding: 0.625rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid;
          font-size: 0.875rem;
          transition: box-shadow 0.2s;
          outline: none;
          border-color: #d1d5db;
          background-color: #fff;
          color: #111827;
        }
        .setting-input.has-icon {
          padding-left: 2.5rem;
        }
        .setting-input:focus {
          box-shadow: 0 0 0 2px rgba(59,130,246,0.5);
        }
        :is(.dark) .setting-input {
          border-color: #4b5563;
          background-color: #1f2937;
          color: #f3f4f6;
        }
      `}</style>
    </div>
  )
}

/* ==================== Sub-Components ==================== */

function SettingField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}

function StatusBadge({ active, label }: { active: boolean; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
        active
          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
          : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-gray-400"}`} />
      {label ?? (active ? "Connected" : "Not connected")}
    </span>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
}