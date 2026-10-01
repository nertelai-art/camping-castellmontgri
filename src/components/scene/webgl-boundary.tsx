"use client";

import { Component, type ReactNode } from "react";

/**
 * Atrapa la fallada d'una escena 3D (típicament, el navegador no pot crear el context WebGL) i avisa perquè
 * es mostri la versió sense 3D. Així no cal crear un context de prova abans: és car i es faria dues vegades.
 */
export class WebGLBoundary extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFail();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
