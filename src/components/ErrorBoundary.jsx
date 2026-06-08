import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, info: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('🔴 App crashed:', error, info);
        this.setState({ info });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, info: null });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-rose-100 flex items-center justify-center text-4xl">
                        ⚠️
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 mb-2">Something went wrong</h1>
                        <p className="text-slate-500 text-sm font-medium mb-4 max-w-sm mx-auto">
                            The app encountered an unexpected error. Tap below to go back to the home screen.
                        </p>
                        <details className="text-left bg-slate-100 rounded-2xl p-4 mb-6 max-w-sm mx-auto">
                            <summary className="text-xs font-bold text-rose-600 cursor-pointer mb-2">Error Details</summary>
                            <pre className="text-[10px] text-slate-600 whitespace-pre-wrap break-all">
                                {this.state.error?.toString()}
                                {'\n\n'}
                                {this.state.info?.componentStack}
                            </pre>
                        </details>
                    </div>
                    <button
                        onClick={this.handleReset}
                        className="px-8 py-3 bg-[#1a227f] text-white font-black rounded-2xl text-sm uppercase tracking-widest shadow-lg"
                    >
                        Go to Home
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
