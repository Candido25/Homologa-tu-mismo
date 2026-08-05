"use client";

import { useState } from "react";

type FAQItem = {
  question: string;
  answer: string | React.ReactNode;
};

type FAQCategory = {
  title: string;
  items: FAQItem[];
};

const faqs: FAQCategory[] = [
  {
    title: "Requisitos Generales",
    items: [
      {
        question: "¿Qué documentos necesito para iniciar el trámite?",
        answer: "Por lo general, necesitarás tu documento de identidad (Pasaporte o NIE), el título universitario original y el certificado académico o plan de estudios, ambos debidamente legalizados o apostillados, y en caso necesario, traducidos."
      },
      {
        question: "¿Cuál es la diferencia entre Homologación y Equivalencia?",
        answer: "La Homologación te permite ejercer una profesión regulada en España (ej. Médico, Ingeniero Civil). La Equivalencia certifica tu nivel académico (ej. Licenciatura, Máster) para profesiones no reguladas o fines académicos."
      }
    ]
  },
  {
    title: "Traducción Jurada vs. Apostilla",
    items: [
      {
        question: "¿Qué es la Apostilla de la Haya?",
        answer: "Es un sello que certifica la autenticidad de la firma del documento público. Si tu país firmó el Convenio de la Haya, necesitas este sello. Si no, requieres legalización por vía diplomática."
      },
      {
        question: "¿Cuándo necesito una Traducción Jurada?",
        answer: "Si tus documentos originales no están en castellano (o en la lengua cooficial de la comunidad autónoma donde lo presentes), deben ser traducidos por un Traductor Jurado oficial reconocido por el Ministerio de Asuntos Exteriores de España."
      }
    ]
  },
  {
    title: "Tiempos de Espera y Estado",
    items: [
      {
        question: "¿Cuánto tarda el Ministerio en resolver?",
        answer: "Aunque la ley estipula un plazo máximo de 6 meses, los tiempos reales suelen ser de entre 1 y 2 años (o más), dependiendo de la carga de trabajo y de la profesión solicitada."
      },
      {
        question: "¿Qué significa 'Homologación Condicionada'?",
        answer: "Significa que la administración ha detectado carencias formativas entre tus estudios y la titulación española equivalente, por lo que deberás superar pruebas de aptitud, un periodo de prácticas o cursos complementarios antes de obtener la homologación definitiva."
      }
    ]
  }
];

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggle = (index: string) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-6">
      {faqs.map((category, catIdx) => (
        <div key={catIdx} className="bg-surface rounded-lg border border-line overflow-hidden shadow-sm">
          <div className="bg-soft px-5 py-3 border-b border-line">
            <h3 className="font-bold text-ink text-sm uppercase tracking-wider">{category.title}</h3>
          </div>
          <div className="divide-y divide-line">
            {category.items.map((item, itemIdx) => {
              const id = `${catIdx}-${itemIdx}`;
              const isOpen = openIndex === id;
              return (
                <div key={itemIdx} className="flex flex-col">
                  <button
                    onClick={() => toggle(id)}
                    className="flex justify-between items-center w-full px-5 py-4 text-left hover:bg-soft/50 transition-colors focus:outline-none focus:bg-soft/50"
                  >
                    <span className="font-medium text-ink">{item.question}</span>
                    <svg
                      className={`w-5 h-5 text-muted transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`px-5 overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-96 py-4 opacity-100 border-t border-line" : "max-h-0 py-0 opacity-0"
                    }`}
                  >
                    <p className="text-muted text-sm leading-relaxed">{item.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
