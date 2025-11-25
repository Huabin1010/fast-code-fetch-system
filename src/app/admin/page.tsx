'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FolderOpen,
  Database,
  FileText,
  TrendingUp,
  Plus,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { getProjectList } from './projects/actions'
import Link from 'next/link'
import { useTranslation } from '@/components/providers/I18nProvider'

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalIndexes: 0,
    totalFiles: 0,
    recentProjects: [] as any[],
  })
  const [loading, setLoading] = useState(true)

  // TODO: 从认证系统获取 userId
  // 当前使用管理员用户 ID (匹配 NextAuth 中的默认管理员账号)
  const userId = '1'

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    const result = await getProjectList(userId)

    if (result.success) {
      const projects = result.data || []
      const totalProjects = projects.length
      const totalIndexes = projects.reduce((sum, p) => sum + (p._count?.indexes || 0), 0)

      setStats({
        totalProjects,
        totalIndexes,
        totalFiles: 0, // 需要额外查询
        recentProjects: projects.slice(0, 5),
      })
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-gray-600 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* 统计卡片 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{t('dashboard.totalProjects')}</CardTitle>
                <FolderOpen className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalProjects}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalProjects > 0 ? t('dashboard.projectsManaged') : t('dashboard.noProjects')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{t('dashboard.totalIndexes')}</CardTitle>
                <Database className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalIndexes}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalIndexes > 0 ? t('dashboard.activeIndexes') : t('dashboard.noIndexes')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{t('dashboard.averageIndexes')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.totalProjects > 0
                    ? (stats.totalIndexes / stats.totalProjects).toFixed(1)
                    : '0'}
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('dashboard.averagePerProject')}</p>
              </CardContent>
            </Card>
          </div>

          {/* 快速操作 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.quickStart')}</CardTitle>
              <CardDescription>{t('dashboard.quickStartDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Link href="/admin/projects">
                  <Button variant="outline" className="w-full justify-start h-auto py-4">
                    <div className="flex items-start gap-3">
                      <Plus className="h-5 w-5 mt-0.5" />
                      <div className="text-left">
                        <div className="font-semibold">{t('dashboard.createNewProject')}</div>
                        <div className="text-sm text-gray-500 font-normal">
                          {t('dashboard.createNewProjectDesc')}
                        </div>
                      </div>
                    </div>
                  </Button>
                </Link>

                <Link href="/admin/projects">
                  <Button variant="outline" className="w-full justify-start h-auto py-4">
                    <div className="flex items-start gap-3">
                      <FolderOpen className="h-5 w-5 mt-0.5" />
                      <div className="text-left">
                        <div className="font-semibold">{t('dashboard.browseProjects')}</div>
                        <div className="text-sm text-gray-500 font-normal">
                          {t('dashboard.browseProjectsDesc')}
                        </div>
                      </div>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* 最近的项目 */}
          {stats.recentProjects.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('dashboard.recentProjects')}</CardTitle>
                    <CardDescription>{t('dashboard.recentProjectsDesc')}</CardDescription>
                  </div>
                  <Link href="/admin/projects">
                    <Button variant="ghost" size="sm">
                      {t('common.viewAll')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentProjects.map((project) => (
                    <Link key={project.id} href={`/admin/projects/${project.id}`}>
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FolderOpen className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{project.name}</div>
                            {project.description && (
                              <div className="text-sm text-gray-500 truncate">
                                {project.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">{project._count?.indexes || 0}</span>{t('dashboard.indexes')}
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 空状态 */}
          {stats.totalProjects === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('dashboard.startFirstProject')}</h3>
                <p className="text-gray-500 text-center mb-6 max-w-md">
                  {t('dashboard.startFirstProjectDesc')}
                </p>
                <Link href="/admin/projects">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('dashboard.createProject')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* 使用提示 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">💡 {t('dashboard.usageTips')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="font-semibold mt-0.5">1.</span>
                  <span>
                    <strong>{t('dashboard.tip1Title')}</strong>
                    {t('dashboard.tip1Desc')}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold mt-0.5">2.</span>
                  <span>
                    <strong>{t('dashboard.tip2Title')}</strong>
                    {t('dashboard.tip2Desc')}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold mt-0.5">3.</span>
                  <span>
                    <strong>{t('dashboard.tip3Title')}</strong>
                    {t('dashboard.tip3Desc')}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold mt-0.5">4.</span>
                  <span>
                    <strong>{t('dashboard.tip4Title')}</strong>
                    {t('dashboard.tip4Desc')}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
