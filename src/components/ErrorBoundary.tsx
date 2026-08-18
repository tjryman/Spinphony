import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

// Renders crashes as a readable message instead of a black screen.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', background: '#0b0e14', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <p style={{ fontSize: 40 }}>😵</p>
            <h1 style={{ fontWeight: 700, fontSize: 18, marginTop: 8 }}>Spinphony hit an error</h1>
            <p style={{ color: '#f87171', fontSize: 13, marginTop: 12, fontFamily: 'monospace', wordBreak: 'break-word' }}>
              {this.state.error.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: 20, padding: '10px 20px', borderRadius: 12, background: '#7c3aed', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
