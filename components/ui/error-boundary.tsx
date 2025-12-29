'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from './button'
import Link from 'next/link'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showHomeLink?: boolean
  title?: string
  description?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error Boundary Component
 * Catches JavaScript errors in child component tree and displays a fallback UI.
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <ComponentThatMightFail />
 * </ErrorBoundary>
 * ```
 * 
 * With custom fallback:
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <ComponentThatMightFail />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error)
    console.error('Component stack:', errorInfo.componentStack)
    
    this.setState({ errorInfo })
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-[300px] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            
            <h3 className="font-semibold text-gray-900 text-lg mb-2">
              {this.props.title || 'Something went wrong'}
            </h3>
            
            <p className="text-sm text-gray-500 mb-6">
              {this.props.description || 
                'An unexpected error occurred. Please try again or contact support if the problem persists.'}
            </p>

            {/* Error details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-left">
                <p className="text-xs font-mono text-red-700 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={this.handleRetry}
                variant="default"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              
              {this.props.showHomeLink && (
                <Link href="/student/dashboard">
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
                    <Home className="w-4 h-4" />
                    Go to Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Specialized error boundary for face recognition components
 */
export class FaceRecognitionErrorBoundary extends Component<
  Omit<ErrorBoundaryProps, 'title' | 'description'>,
  ErrorBoundaryState
> {
  constructor(props: Omit<ErrorBoundaryProps, 'title' | 'description'>) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Face recognition error:', error)
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-6 text-center bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
          <h3 className="font-semibold text-amber-900 mb-2">
            Face Recognition Unavailable
          </h3>
          <p className="text-sm text-amber-700 mb-4">
            The face recognition system encountered an error. This might be due to:
          </p>
          <ul className="text-sm text-amber-700 text-left mb-4 space-y-1 max-w-xs mx-auto">
            <li>• Camera access being blocked</li>
            <li>• Face detection models failing to load</li>
            <li>• Browser compatibility issues</li>
          </ul>
          <Button 
            onClick={this.handleRetry}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Specialized error boundary for camera/scanner components
 */
export class CameraErrorBoundary extends Component<
  Omit<ErrorBoundaryProps, 'title' | 'description'>,
  ErrorBoundaryState
> {
  constructor(props: Omit<ErrorBoundaryProps, 'title' | 'description'>) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Camera error:', error)
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-6 text-center bg-blue-50 border border-blue-200 rounded-xl">
          <AlertTriangle className="w-10 h-10 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold text-blue-900 mb-2">
            Camera Access Error
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            Unable to access your camera. Please check:
          </p>
          <ul className="text-sm text-blue-700 text-left mb-4 space-y-1 max-w-xs mx-auto">
            <li>• Camera permissions are enabled</li>
            <li>• No other app is using the camera</li>
            <li>• Your device has a working camera</li>
          </ul>
          <Button 
            onClick={this.handleRetry}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
