import { useState, useEffect } from 'react';
import { X, FileText, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

const PDFModal = ({ isOpen, onClose, onGenerate, selectedQuestions = [] }) => {
  const [professorName, setProfessorName] = useState('');
  const [documentTitle, setDocumentTitle] = useState('Lista de Exercícios'); // Novo campo de título
  const [orderedQuestions, setOrderedQuestions] = useState([]);

  // Quando o modal abre ou as questões mudam, atualiza a lista local
  useEffect(() => {
    if (isOpen) {
      setOrderedQuestions([...selectedQuestions]);
    }
  }, [isOpen, selectedQuestions]);

  if (!isOpen) return null;

  // Função para mover questão para cima
  const moveUp = (index) => {
    if (index === 0) return;
    const newList = [...orderedQuestions];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    setOrderedQuestions(newList);
  };

  // Função para mover questão para baixo
  const moveDown = (index) => {
    if (index === orderedQuestions.length - 1) return;
    const newList = [...orderedQuestions];
    [newList[index + 1], newList[index]] = [newList[index], newList[index + 1]];
    setOrderedQuestions(newList);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Envia o nome, o título e a LISTA ORDENADA
    onGenerate(professorName, documentTitle, orderedQuestions);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-800">Gerar Documento PDF</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            
            {/* Configurações do Cabeçalho */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Professor/Instituição
                </label>
                <input
                  type="text"
                  value={professorName}
                  onChange={(e) => setProfessorName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ex: Prof. Silva - Colégio X"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título do Documento
                </label>
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ex: Prova Bimestral, Lista 01..."
                />
              </div>
            </div>

            {/* Área de Reordenação */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex justify-between items-center">
                <span>Organizar Questões ({orderedQuestions.length})</span>
                <span className="text-xs text-gray-500 font-normal">Use as setas para reordenar</span>
              </h3>
              
              <div className="border border-gray-200 rounded-lg bg-gray-50 max-h-60 overflow-y-auto divide-y divide-gray-200">
                {orderedQuestions.map((question, index) => (
                  <div key={question.id} className="p-3 flex items-center gap-3 bg-white hover:bg-gray-50">
                    <div className="flex flex-col gap-1 text-gray-400">
                      <button
                        type="button"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover para cima"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDown(index)}
                        disabled={index === orderedQuestions.length - 1}
                        className="hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          Questão {index + 1}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                          {question.materia} • {question.nivel}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 truncate">
                        {question.enunciado}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Gerar PDF
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PDFModal;