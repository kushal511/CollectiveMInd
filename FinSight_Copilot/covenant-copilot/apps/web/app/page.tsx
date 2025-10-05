'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Download, Play, Square, TrendingUp, TrendingDown, DollarSign, Activity, FileText, Bell, Zap, Shield, Eye } from 'lucide-react'

interface CovenantTest {
  actual: number
  limit: number
  status: 'PASS' | 'BREACH'
  margin: number
}

interface CovenantResults {
  result_id?: number
  company: string
  period: string
  overall_status: 'PASS' | 'BREACH'
  tests: {
    leverage: CovenantTest
    coverage: CovenantTest
    liquidity: CovenantTest
  }
  red_flags: Array<{
    rule: string
    actual: number
    limit: number
    margin: number
    message: string
  }>
}

export default function Dashboard() {
  const [results, setResults] = useState<CovenantResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [watcherRunning, setWatcherRunning] = useState(false)
  const [memoGenerated, setMemoGenerated] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)
  const [liveUpdates, setLiveUpdates] = useState(0)

  useEffect(() => {
    setAnimateIn(true)
    if (watcherRunning) {
      const interval = setInterval(() => {
        setLiveUpdates(prev => prev + 1)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [watcherRunning])

  const runCovenantCheck = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/run-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: 'Tesla Inc.',
          period: 'Q2 2025',
          data_path: '../../data'
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Covenant check results:', data)
        setResults(data)
      } else {
        const errorText = await response.text()
        console.error('Failed to run covenant check:', response.status, errorText)
        alert(`Error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Error running covenant check:', error)
      alert(`Network error: ${error}. Make sure backend is running on http://localhost:8000`)
    } finally {
      setLoading(false)
    }
  }

  const generateMemo = async () => {
    if (!results) return
    
    try {
      const response = await fetch('http://localhost:8000/api/memo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          result_id: results.result_id
        }),
      })
      
      if (response.ok) {
        setMemoGenerated(true)
      }
    } catch (error) {
      console.error('Error generating memo:', error)
    }
  }

  const startWatcher = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/watch/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: 60,
          data_path: './data/JSON'
        }),
      })
      
      if (response.ok) {
        setWatcherRunning(true)
      }
    } catch (error) {
      console.error('Error starting watcher:', error)
    }
  }

  const stopWatcher = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/watch/stop', {
        method: 'POST',
      })
      
      if (response.ok) {
        setWatcherRunning(false)
      }
    } catch (error) {
      console.error('Error stopping watcher:', error)
    }
  }

  const getStatusIcon = (status: 'PASS' | 'BREACH') => {
    return status === 'PASS' ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertCircle className="h-5 w-5 text-red-500" />
    )
  }

  const getStatusBadge = (status: 'PASS' | 'BREACH') => {
    return (
      <Badge variant={status === 'PASS' ? 'default' : 'destructive'}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        {/* Header with Gradient */}
        <div className={`mb-8 transition-all duration-1000 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Covenant Monitoring Copilot
                </h1>
              </div>
              <p className="text-gray-600 ml-14 flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>AI-powered real-time covenant monitoring with LandingAI DPT-2 & Pathway</span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Live Updates</div>
                <div className="text-2xl font-bold text-blue-600">{liveUpdates}</div>
              </div>
              {watcherRunning && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 rounded-full">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">Live</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Company Selector and Actions - Premium Design */}
        <div className={`mb-8 transition-all duration-1000 delay-100 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Control Center</span>
              </CardTitle>
              <CardDescription className="text-blue-100">Monitor Tesla Inc. covenant compliance in real-time</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Company Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <label className="text-sm font-medium text-gray-600">Company</label>
                  </div>
                  <p className="text-xl font-bold text-gray-900">Tesla Inc.</p>
                  <p className="text-sm text-gray-500">NASDAQ: TSLA</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <label className="text-sm font-medium text-gray-600">Period</label>
                  </div>
                  <p className="text-xl font-bold text-gray-900">Q2 2025</p>
                  <p className="text-sm text-gray-500">Latest Filing</p>
                </div>
              </div>
              
              {/* Action Buttons - Premium Style */}
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={runCovenantCheck} 
                  disabled={loading}
                  className="flex-1 min-w-[200px] h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      <span className="font-semibold">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      <span className="font-semibold">Run Covenant Check</span>
                    </>
                  )}
                </Button>

                {results && (
                  <Button 
                    onClick={generateMemo}
                    className="flex-1 min-w-[180px] h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Generate Memo</span>
                  </Button>
                )}

                <Button 
                  onClick={watcherRunning ? stopWatcher : startWatcher}
                  className={`flex-1 min-w-[180px] h-12 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                    watcherRunning 
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700' 
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                  } text-white`}
                >
                  {watcherRunning ? (
                    <>
                      <Square className="h-5 w-5 mr-2" />
                      <span className="font-semibold">Stop Monitoring</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-5 w-5 mr-2" />
                      <span className="font-semibold">Start Live Monitor</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results - Premium Design */}
        {results && (
          <div className="space-y-6">
            {/* Overall Status - Hero Card */}
            <Card className={`border-0 shadow-2xl overflow-hidden transition-all duration-700 ${animateIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className={`p-8 ${
                results.overall_status === 'BREACH' 
                  ? 'bg-gradient-to-r from-red-600 via-pink-600 to-red-600' 
                  : 'bg-gradient-to-r from-green-600 via-emerald-600 to-green-600'
              } text-white relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                        {results.overall_status === 'BREACH' ? (
                          <AlertCircle className="h-8 w-8" />
                        ) : (
                          <CheckCircle className="h-8 w-8" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold">Covenant Status</h2>
                        <p className="text-white/80">{results.company} - {results.period}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-block px-6 py-3 rounded-full text-2xl font-bold ${
                        results.overall_status === 'BREACH' 
                          ? 'bg-red-900/50 text-white' 
                          : 'bg-green-900/50 text-white'
                      } backdrop-blur-sm`}>
                        {results.overall_status}
                      </div>
                    </div>
                  </div>
                  {results.overall_status === 'BREACH' && (
                    <div className="mt-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-5 w-5 animate-pulse" />
                        <span className="font-semibold">Alert: Immediate action required - Covenant breach detected</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Covenant Tests - Premium Cards with Animations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Leverage */}
              <Card className={`border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
                results.tests.leverage.status === 'BREACH' ? 'bg-gradient-to-br from-red-50 to-pink-50 border-l-4 border-red-500' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500'
              }`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className={`h-5 w-5 ${results.tests.leverage.status === 'BREACH' ? 'text-red-600' : 'text-green-600'}`} />
                      <span>Leverage Ratio</span>
                    </div>
                    {getStatusIcon(results.tests.leverage.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {results.tests.leverage.actual}x
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Limit:</span>
                      <span className="text-lg font-semibold">{results.tests.leverage.limit}x</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Margin:</span>
                      <span className={`text-lg font-semibold ${results.tests.leverage.margin < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {results.tests.leverage.margin > 0 ? '+' : ''}{results.tests.leverage.margin}x
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        results.tests.leverage.status === 'BREACH' ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'
                      }`}
                      style={{ width: `${Math.min((results.tests.leverage.actual / results.tests.leverage.limit) * 100, 100)}%` }}
                    ></div>
                  </div>
                  {getStatusBadge(results.tests.leverage.status)}
                </CardContent>
              </Card>

              {/* Coverage */}
              <Card className={`border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
                results.tests.coverage.status === 'BREACH' ? 'bg-gradient-to-br from-red-50 to-pink-50 border-l-4 border-red-500' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500'
              }`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className={`h-5 w-5 ${results.tests.coverage.status === 'BREACH' ? 'text-red-600' : 'text-blue-600'}`} />
                      <span>Interest Coverage</span>
                    </div>
                    {getStatusIcon(results.tests.coverage.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {results.tests.coverage.actual}x
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Minimum:</span>
                      <span className="text-lg font-semibold">{results.tests.coverage.limit}x</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Margin:</span>
                      <span className={`text-lg font-semibold ${results.tests.coverage.margin < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        +{results.tests.coverage.margin}x
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000"
                      style={{ width: `${Math.min((results.tests.coverage.actual / (results.tests.coverage.limit * 2)) * 100, 100)}%` }}
                    ></div>
                  </div>
                  {getStatusBadge(results.tests.coverage.status)}
                </CardContent>
              </Card>

              {/* Liquidity */}
              <Card className={`border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
                results.tests.liquidity.status === 'BREACH' ? 'bg-gradient-to-br from-red-50 to-pink-50 border-l-4 border-red-500' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-l-4 border-purple-500'
              }`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className={`h-5 w-5 ${results.tests.liquidity.status === 'BREACH' ? 'text-red-600' : 'text-purple-600'}`} />
                      <span>Liquidity</span>
                    </div>
                    {getStatusIcon(results.tests.liquidity.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    ${results.tests.liquidity.actual.toLocaleString()}M
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Minimum:</span>
                      <span className="text-lg font-semibold">${results.tests.liquidity.limit}M</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Margin:</span>
                      <span className="text-lg font-semibold text-green-600">
                        +${results.tests.liquidity.margin.toLocaleString()}M
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                  {getStatusBadge(results.tests.liquidity.status)}
                </CardContent>
              </Card>
            </div>

            {/* Red Flags - Animated Alert */}
            {results.red_flags.length > 0 && (
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-red-50 via-pink-50 to-red-50 animate-pulse-slow">
                <CardHeader className="bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="p-2 bg-white/20 rounded-full animate-pulse">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <span className="text-xl">🚨 Critical Alerts Detected</span>
                    <Badge className="ml-auto bg-white text-red-600 font-bold">{results.red_flags.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {results.red_flags.map((flag, index) => (
                      <div 
                        key={index} 
                        className="p-5 bg-white border-l-4 border-red-500 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-red-100 rounded-full">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-lg text-red-800">
                                {flag.rule.toUpperCase()} BREACH
                              </h4>
                              <Badge variant="destructive" className="text-xs">
                                HIGH PRIORITY
                              </Badge>
                            </div>
                            <p className="text-red-700 font-medium mb-2">
                              {flag.message}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Actual: <strong className="text-red-600">{flag.actual}</strong></span>
                              <span>•</span>
                              <span>Limit: <strong>{flag.limit}</strong></span>
                              <span>•</span>
                              <span>Variance: <strong className="text-red-600">{Math.abs(flag.margin)}</strong></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Bell className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-800 mb-1">Recommended Actions</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• Contact legal and finance teams immediately</li>
                          <li>• Prepare breach notification per credit agreement</li>
                          <li>• Develop remediation plan to restore compliance</li>
                          <li>• Consider requesting covenant waiver if appropriate</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Memo Status */}
            {memoGenerated && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Download className="h-5 w-5 text-green-500" />
                    <span>Memo Generated</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-green-600">
                    Covenant compliance memo has been generated and is ready for download.
                  </p>
                  <Button className="mt-2" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Watcher Status - Premium Live Monitor */}
        {watcherRunning && (
          <Card className="mt-6 border-0 shadow-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 animate-pulse"></div>
            <CardHeader className="relative">
              <CardTitle className="flex items-center space-x-3">
                <div className="relative">
                  <div className="h-4 w-4 bg-green-500 rounded-full animate-ping absolute"></div>
                  <div className="h-4 w-4 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-xl">Pathway Live Monitoring Active</span>
                <Badge className="ml-auto bg-green-600 text-white animate-pulse">LIVE</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-white rounded-lg shadow">
                  <div className="text-sm text-gray-600 mb-1">Files Monitored</div>
                  <div className="text-2xl font-bold text-green-600">5</div>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                  <div className="text-sm text-gray-600 mb-1">Updates Detected</div>
                  <div className="text-2xl font-bold text-blue-600">{liveUpdates}</div>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                  <div className="text-sm text-gray-600 mb-1">Status</div>
                  <div className="text-2xl font-bold text-green-600">Active</div>
                </div>
              </div>
              <div className="p-4 bg-white rounded-lg shadow-inner">
                <div className="flex items-start space-x-3">
                  <Eye className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Real-Time Monitoring</h4>
                    <p className="text-gray-600 text-sm">
                      Pathway framework is actively monitoring your data room for changes. 
                      Any new or modified files will trigger automatic covenant checks and instant alerts.
                    </p>
                    <div className="mt-3 flex items-center space-x-2 text-sm text-green-600">
                      <Zap className="h-4 w-4" />
                      <span className="font-medium">Instant processing • Auto-alerts • Living memos</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
