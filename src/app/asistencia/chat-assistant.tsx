"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string | React.ReactNode;
};

export function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      content: "¡Hola! Soy el asistente virtual de Homologa Tú Mismo. Cuéntame sobre tu caso, por ejemplo: 'Soy ingeniero civil de Perú, ¿necesito examen de colegiación?'",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const generateResponse = (query: string): React.ReactNode => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("ingenier") && lowerQuery.includes("per")) {
      return (
        <div className="space-y-2">
          <p>Para homologar tu título de <strong>Ingeniería</strong> desde <strong>Perú</strong>, debes seguir estos pasos según el Ministerio de Universidades:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Tu título y certificado académico deben estar apostillados.</li>
            <li>La ingeniería suele ser una <strong>profesión regulada</strong> en España, por lo que aplicaría un trámite de <strong>Homologación</strong> (no equivalencia).</li>
            <li>Al ser de Perú, no requieres traducción jurada.</li>
            <li>Dependiendo de la evaluación de tu plan de estudios, podrías requerir cursar créditos adicionales (Homologación condicionada).</li>
            <li>Una vez homologado, deberás colegiarte en el Colegio Oficial de Ingenieros de tu rama para ejercer.</li>
          </ul>
        </div>
      );
    }

    if (lowerQuery.includes("medico") || lowerQuery.includes("medicina")) {
      return "La medicina es una profesión regulada de alta prioridad. Requerirás Homologación. Debes presentar título y notas apostilladas. Si no vienes de un país hispanohablante, debes acreditar un nivel B2 o C1 de español. Una vez homologado, es obligatoria la colegiación en la provincia donde vayas a ejercer.";
    }

    if (lowerQuery.includes("cuanto tiempo") || lowerQuery.includes("tarda")) {
      return "Legalmente, el Ministerio tiene hasta 6 meses para resolver. Sin embargo, en la práctica, los trámites están tardando entre 1 y 2 años, dependiendo del volumen de solicitudes y la profesión específica.";
    }

    return "Gracias por tu consulta. Para darte una orientación más precisa, por favor indícame tu titulación exacta, el país donde la obtuviste y si tu objetivo es trabajar o continuar estudiando.";
  };

  const handleSend = () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate network delay and logic processing
    setTimeout(() => {
      const responseContent = generateResponse(userMessage.content as string);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-surface rounded-lg border border-line shadow-sm flex flex-col h-[500px]">
      <div className="bg-brand text-white px-5 py-4 rounded-t-lg flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold">
          HT
        </div>
        <div>
          <h3 className="font-bold leading-tight">Asistente Homologa</h3>
          <p className="text-xs text-brand-100 opacity-80">Respuestas basadas en normativa oficial</p>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-soft/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                msg.role === "user"
                  ? "bg-brand text-white rounded-br-none"
                  : "bg-white border border-line text-ink rounded-bl-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-line rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex gap-1 items-center h-[44px]">
              <div className="w-2 h-2 bg-muted/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-muted/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-muted/50 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white border-t border-line rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 p-3 border border-line rounded-full focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm"
            placeholder="Escribe tu consulta aquí..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-12 h-12 bg-brand text-white rounded-full flex items-center justify-center hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Enviar mensaje"
          >
            <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
