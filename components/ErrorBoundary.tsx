/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree and displays a fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <View className="flex-1 justify-center items-center p-6 bg-primary-dark">
          <Ionicons name="alert-circle-outline" size={80} color="#ef4444" />
          <Text className="text-white text-2xl font-bold mt-6 text-center">
            Something Went Wrong
          </Text>
          <Text className="text-gray-400 text-center mt-3 leading-6">
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          
          {__DEV__ && this.state.error && (
            <View className="mt-6 p-4 bg-gray-800 rounded-xl w-full">
              <Text className="text-red-400 text-xs font-mono">
                {this.state.error.stack}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={this.handleReset}
            className="mt-8 bg-primary-accent px-8 py-4 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-primary-dark font-bold text-lg">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

