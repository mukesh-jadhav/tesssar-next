"use client";

import { Component, type ReactNode } from "react";

export class DiagramErrorBoundary extends Component<
  { children: ReactNode; chart?: string },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[diagram] render crash", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="w-full p-6 bg-[hsl(var(--paper-2))] border border-[hsl(var(--line))]">
          <p className="eyebrow text-[hsl(var(--bad))]">Diagram could not be rendered</p>
          <p className="mt-2 font-mono text-[12px] text-[hsl(var(--ink-2))]">
            {this.state.error.message || "Unknown error"}
          </p>
          {this.props.chart && (
            <details className="mt-3">
              <summary className="cursor-pointer text-[12px] text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))]">
                Show diagram source
              </summary>
              <pre className="mt-2 max-h-[300px] overflow-auto p-3 bg-[hsl(var(--paper))] border border-[hsl(var(--line))] font-mono text-[11px] leading-[1.5] text-[hsl(var(--ink-2))] whitespace-pre-wrap">
                {this.props.chart}
              </pre>
            </details>
          )}
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-4 btn-pill !text-[12px]"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
