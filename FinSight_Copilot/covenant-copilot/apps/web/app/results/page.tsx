'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Download, Eye, Calendar } from 'lucide-react'

interface HistoricalResult {
  result_id: number
  company: string
  period: string
  overall_status: 'PASS' | 'BREACH'
  tests: {
    leverage: { actual: number; limit: number; status: 'PASS' | 'BREACH'; margin: number }
    coverage: { actual: number; limit: number; status: 'PASS' | 'BREACH'; margin: number }
    liquidity: { actual: number; limit: number; status: 'PASS' | 'BREACH'; margin: number }
  }
  red_flags: Array<{
    rule: string
    actual: number
    threshold: number
    message: string
  }>
  created_at: string
}

export default function ResultsPage() {
  const [results, setResults] = useState<HistoricalResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedResult, setSelectedResult] = useState<HistoricalResult | null>(null)

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/results/latest?company=Tesla Inc.')
      if (response.ok) {
        const data = await response.json()
        // For demo, create multiple historical results
        const historicalResults: HistoricalResult[] = [
          {
            ...data,
            result_id: 1,
            period: 'Q2 2025',
            created_at: '2025-01-04T10:00:00Z'
          },
          {
            ...data,
            result_id: 2,
            period: 'Q1 2025',
            overall_status: 'PASS',
            tests: {
              leverage: { actual: 3.2, limit: 3.5, status: 'PASS', margin: 0.3 },
              coverage: { actual: 8.5, limit: 2.0, status: 'PASS', margin: 6.5 },
              liquidity: { actual: 15200, limit: 100, status: 'PASS', margin: 15100 }
            },
            red_flags: [],
            created_at: '2025-01-01T10:00:00Z'
          },
          {
            ...data,
            result_id: 3,
            period: 'Q4 2024',
            overall_status: 'BREACH',
            tests: {
              leverage: { actual: 3.8, limit: 3.5, status: 'BREACH', margin: -0.3 },
              coverage: { actual: 7.8, limit: 2.0, status: 'PASS', margin: 5.8 },
              liquidity: { actual: 14800, limit: 100, status: 'PASS', margin: 14700 }
            },
            red_flags: [
              {
                rule: 'leverage',
                actual: 3.8,
                threshold: 3.5,
                message: 'LEVERAGE BREACH: 3.8x vs 3.5x'
              }
            ],
            created_at: '2024-12-01T10:00:00Z'
          }
        ]
        setResults(historicalResults)
        setSelectedResult(historicalResults[0])
      }
    } catch (error) {
      console.error('Error loading results:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadMemo = async (resultId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/memo/${resultId}/download?format=pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `covenant-memo-${resultId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading memo:', error)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Historical Results</h1>
          <p className="text-gray-600 mt-2">View past covenant compliance checks and download memos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Results List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Check History</span>
                </CardTitle>
                <CardDescription>Select a result to view details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {results.map((result) => (
                  <div
                    key={result.result_id}
                    onClick={() => setSelectedResult(result)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors border ${
                      selectedResult?.result_id === result.result_id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{result.period}</div>
                      {getStatusIcon(result.overall_status)}
                    </div>
                    <div className="text-sm opacity-70">
                      {new Date(result.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-sm opacity-70">
                      {result.red_flags.length} red flag{result.red_flags.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Result Details */}
          <div className="lg:col-span-2">
            {selectedResult ? (
              <div className="space-y-6">
                {/* Overall Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(selectedResult.overall_status)}
                        <span>Overall Status</span>
                      </div>
                      {getStatusBadge(selectedResult.overall_status)}
                    </CardTitle>
                    <CardDescription>
                      {selectedResult.company} - {selectedResult.period}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600">
                      Checked on {new Date(selectedResult.created_at).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                {/* Covenant Tests */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Leverage */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>Leverage</span>
                        {getStatusIcon(selectedResult.tests.leverage.status)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {selectedResult.tests.leverage.actual}x
                      </div>
                      <div className="text-sm text-gray-600">
                        Limit: {selectedResult.tests.leverage.limit}x
                      </div>
                      <div className="text-sm text-gray-600">
                        Margin: {selectedResult.tests.leverage.margin}x
                      </div>
                    </CardContent>
                  </Card>

                  {/* Coverage */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>Coverage</span>
                        {getStatusIcon(selectedResult.tests.coverage.status)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {selectedResult.tests.coverage.actual}x
                      </div>
                      <div className="text-sm text-gray-600">
                        Limit: {selectedResult.tests.coverage.limit}x
                      </div>
                      <div className="text-sm text-gray-600">
                        Margin: {selectedResult.tests.coverage.margin}x
                      </div>
                    </CardContent>
                  </Card>

                  {/* Liquidity */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>Liquidity</span>
                        {getStatusIcon(selectedResult.tests.liquidity.status)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${selectedResult.tests.liquidity.actual.toLocaleString()}M
                      </div>
                      <div className="text-sm text-gray-600">
                        Limit: ${selectedResult.tests.liquidity.limit}M
                      </div>
                      <div className="text-sm text-gray-600">
                        Margin: ${selectedResult.tests.liquidity.margin.toLocaleString()}M
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Red Flags */}
                {selectedResult.red_flags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span>Red Flags</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedResult.red_flags.map((flag, index) => (
                          <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="font-medium text-red-800">
                              {flag.rule.toUpperCase()} BREACH
                            </div>
                            <div className="text-sm text-red-600">
                              {flag.message}
                            </div>
                            <div className="text-xs text-red-500 mt-1">
                              Actual: {flag.actual} | Threshold: {flag.threshold}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                    <CardDescription>Download memo or view detailed analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="flex space-x-4">
                    <Button
                      onClick={() => downloadMemo(selectedResult.result_id)}
                      className="flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Memo</span>
                    </Button>
                    <Button variant="outline" className="flex items-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Result Selected</h3>
                  <p className="text-gray-600">Select a result from the history to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
