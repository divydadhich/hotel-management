import { Component } from 'react';
import { Button, Result } from 'antd';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <Result
            status="500"
            title="Application Error"
            subTitle={this.state.error?.message || 'An unexpected error occurred in this view.'}
            extra={[
              <Button
                key="reload"
                type="primary"
                onClick={() => window.location.reload()}
                style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
              >
                Reload Window
              </Button>,
            ]}
          />
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
