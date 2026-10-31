import {Component, type ReactNode} from 'react';
import {ErrorPage} from './ErrorPage';

export class AppErrorBoundary extends Component<{children: ReactNode}, {error: Error | null}> {
  state: {error: Error | null} = {error: null};
  static getDerivedStateFromError(error: Error) { return {error}; }
  render() {
    return this.state.error ? <ErrorPage error={this.state.error}/> : this.props.children;
  }
}
