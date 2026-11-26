import { Component, type ReactNode } from 'react';

/** Keeps one failing page from taking down navigation for the whole site. */
export default class ErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidUpdate(prev: { resetKey: string }) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (this.state.error) {
      return (
        <div className="section">
          <h1 className="h-display text-3xl">This section could not be displayed</h1>
          <p className="mt-3 text-sm text-slate-400">{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
