// Modal para configurar a geração de PDF
import { useState } from 'react';
import { X, FileText } from 'lucide-react';

const PDFModal = ({ isOpen, onClose, onGenerate, questionCount }) => {
  const [professorName, setProfessorName] = useState('');

  const handleGenerate = () => {
    if (!professorName.trim()) {
      alert('Por favor, informe o nome do professor/instituição.');
      return;
    }
    onGenerate(professorName);
    setProfessorName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gerar Prova em PDF
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            {questionCount} questão(ões) selecionada(s)
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Professor/Instituição *
            </label>
            <input
              type="text"
              value={professorName}
              onChange={(e) => setProfessorName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ex: Prof. João Silva"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Gerar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFModal;

