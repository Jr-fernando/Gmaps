import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Falha ao renderizar a tela:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <section className="app-recovery" role="alert">
        <span>Algo não carregou corretamente</span>
        <h2>A tela foi protegida e seus dados continuam salvos.</h2>
        <p>Volte para a lista e tente abrir este contato novamente.</p>
        <button type="button" onClick={() => { this.setState({ hasError: false }); this.props.onRecover?.(); }}>
          Voltar para a lista
        </button>
      </section>
    );
  }
}
