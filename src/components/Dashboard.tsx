'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, User, LogOut, Settings, Upload, FileText, FolderKanban, List } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from '@/components/providers/I18nProvider'
import { LanguageSwitcherButton } from '@/components/ui/language-switcher'

export default function Dashboard() {
  const { data: session } = useSession()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">{t('mainDashboard.headerTitle')}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcherButton />
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {t('mainDashboard.welcome')}, {session?.user?.name || 'Admin'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('mainDashboard.signOut')}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Admin Dashboard Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <span>{t('mainDashboard.adminDashboard')}</span>
                </CardTitle>
                <CardDescription>
                  {t('mainDashboard.adminDashboardDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {t('mainDashboard.adminDashboardContent')}
                </p>
                <Link href="/admin">
                  <Button className="w-full">
                    {t('mainDashboard.openDashboard')}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Projects Management Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FolderKanban className="h-5 w-5 text-purple-600" />
                  <span>{t('mainDashboard.projects')}</span>
                </CardTitle>
                <CardDescription>
                  {t('mainDashboard.projectsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {t('mainDashboard.projectsContent')}
                </p>
                <Link href="/admin/projects">
                  <Button className="w-full">
                    {t('mainDashboard.manageProjects')}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Vector Database Demo Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-green-600" />
                  <span>{t('mainDashboard.vectorDatabase')}</span>
                </CardTitle>
                <CardDescription>
                  {t('mainDashboard.vectorDatabaseDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {t('mainDashboard.vectorDatabaseContent')}
                </p>
                <Link href="/demo/embedding">
                  <Button className="w-full">
                    {t('mainDashboard.openDemo')}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* System Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-green-600" />
                  <span>{t('mainDashboard.systemStatus')}</span>
                </CardTitle>
                <CardDescription>
                  {t('mainDashboard.systemStatusDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('mainDashboard.status')}:</span>
                    <span className="text-green-600 font-medium">{t('mainDashboard.online')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('mainDashboard.auth')}:</span>
                    <span className="text-green-600 font-medium">{t('mainDashboard.active')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('mainDashboard.database')}:</span>
                    <span className="text-green-600 font-medium">{t('mainDashboard.connected')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t('mainDashboard.quickActions')}</CardTitle>
                <CardDescription>
                  {t('mainDashboard.quickActionsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    {t('mainDashboard.adminDashboard')}
                  </Button>
                </Link>
                <Link href="/admin/projects" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FolderKanban className="h-4 w-4 mr-2" />
                    {t('mainDashboard.manageProjects')}
                  </Button>
                </Link>
                <Link href="/demo/embedding" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    {t('mainDashboard.vectorDemo')}
                  </Button>
                </Link>
              </CardContent>
            </Card>

          </div>

          {/* Welcome Message */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>{t('mainDashboard.welcomeTitle')}</CardTitle>
                <CardDescription>
                  {t('mainDashboard.welcomeDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {t('mainDashboard.welcomeContent')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
