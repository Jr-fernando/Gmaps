import React, { useRef, useEffect } from 'react';
import Button from '../common/Button';

export default function CopilotChat({
  chatMessage,
  setChatMessage,
  chatHistory,
  chatLoading,
  handleSendChat
}) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  return (
    <div className="chat-tab" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
        Utilize o copiloto de IA treinado neste lead para criar scripts personalizados, tirar dúvidas de nicho ou planejar objeções.
      </p>

      <div className="chat-container">
        <div className="chat-history">
          {chatHistory.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '40px 0' }}>
              Pergunte algo como: "Quais são as principais dores deste lead?" ou "Escreva um script de fechamento para ele."
            </div>
          )}
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`chat-msg ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
          {chatLoading && (
            <div className="chat-msg assistant" style={{ fontStyle: 'italic', display: 'flex', gap: '6px' }}>
              <div className="loader-spinner" style={{ width: '12px', height: '12px' }}></div>
              Copiloto está formulando uma resposta...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendChat} className="chat-input-bar">
          <input
            type="text"
            className="chat-input"
            placeholder="Digite sua dúvida de vendas..."
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            disabled={chatLoading}
          />
          <Button variant="primary" type="submit" disabled={chatLoading || !chatMessage.trim()}>
            Enviar
          </Button>
        </form>
      </div>
    </div>
  );
}
