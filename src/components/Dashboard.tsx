'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, User, LogOut, Settings, Upload, FileText, FolderKanban, List } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">
                  Welcome, {session?.user?.name || 'Admin'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
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
                  <span>Admin Dashboard</span>
                </CardTitle>
                <CardDescription>
                  View statistics and quick actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Access the main admin dashboard with project statistics and recent activities.
                </p>
                <Link href="/admin">
                  <Button className="w-full">
                    Open Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Projects Management Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FolderKanban className="h-5 w-5 text-purple-600" />
                  <span>Projects</span>
                </CardTitle>
                <CardDescription>
                  Manage your projects and configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Create, view, and manage projects with CRUD operations.
                </p>
                <Link href="/admin/projects">
                  <Button className="w-full">
                    Manage Projects
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Vector Database Demo Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-green-600" />
                  <span>Vector Database</span>
                </CardTitle>
                <CardDescription>
                  Explore vector storage and similarity search with LibSQL
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Interactive demo for creating indexes, storing embeddings, and performing vector similarity searches.
                </p>
                <Link href="/demo/embedding">
                  <Button className="w-full">
                    Open Demo
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* System Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-green-600" />
                  <span>System Status</span>
                </CardTitle>
                <CardDescription>
                  Current system information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-green-600 font-medium">Online</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Auth:</span>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Database:</span>
                    <span className="text-green-600 font-medium">Connected</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin Dashboard
                  </Button>
                </Link>
                <Link href="/admin/projects" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FolderKanban className="h-4 w-4 mr-2" />
                    Manage Projects
                  </Button>
                </Link>
                <Link href="/demo/embedding" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    Vector Demo
                  </Button>
                </Link>
              </CardContent>
            </Card>

          </div>

          {/* Welcome Message */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to the Admin Dashboard</CardTitle>
                <CardDescription>
                  You are successfully logged in as an administrator
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  This is a simple admin dashboard with basic authentication. You can access various features and demos from here.
                  The vector database demo showcases advanced embedding storage and similarity search capabilities.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
