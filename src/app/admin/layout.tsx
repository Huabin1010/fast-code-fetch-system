'use client'

import Link from 'next/link'
import { Database, FolderOpen, Home, Search } from 'lucide-react'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { useTranslation } from '@/components/providers/I18nProvider'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold">{t('navigation.systemTitle')}</h1>
                <p className="text-xs text-gray-500">{t('navigation.systemSubtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* 侧边栏导航 */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg border border-gray-200 p-4 sticky top-24">
              <div className="space-y-1">
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Home className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-700">{t('navigation.home')}</span>
                </Link>
                <Link
                  href="/admin/projects"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FolderOpen className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-700">{t('navigation.myProjects')}</span>
                </Link>
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2">
                    {t('navigation.quickActions')}
                  </p>
                  <Link
                    href="/admin/projects"
                    className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    <span className="text-gray-600">{t('navigation.createProject')}</span>
                  </Link>
                </div>
              </div>
            </nav>
          </aside>

          {/* 主内容区域 */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-6 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>{t('navigation.footerText')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
