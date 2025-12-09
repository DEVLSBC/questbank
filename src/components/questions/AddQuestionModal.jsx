// Modal para adicionar/editar questões com suporte a tipos e subtipos dinâmicos
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubjects } from '../../hooks/useSubjects';
import { X, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';

const AddQuestionModal = ({ isOpen, onClose, onSave, questionToEdit = null }) => {
  const { currentUser } = useAuth();
  const { subjects, getContentsBySubject, getSubjectNames } = useSubjects(currentUser?.uid);
  
  // Estado inicial do formulário
  const [formData, setFormData] = useState({
    type: 'discursiva', // 'discursiva' ou 'objetiva'
    subtype: '', // Para questões objetivas
    enunciado: '',
    materia: '',
    conteudo: '',
    nivel: 'Médio',
    options: [], // Array de alternativas para questões objetivas
    answer: '' // Gabarito/resposta
  });

  // Preencher formulário se estiver editando
  useEffect(() => {
    if (questionToEdit) {
      // Compatibilidade com questões antigas
      const isOldFormat = questionToEdit.tipo && !questionToEdit.type;
      
      if (isOldFormat) {
        // Migrar formato antigo para novo
        const oldType = questionToEdit.tipo;
        let newType = 'discursiva';
        let newSubtype = '';
        
        if (oldType === 'Múltipla Escolha') {
          newType = 'objetiva';
          newSubtype = 'multipla_escolha';
        } else if (oldType === 'V/F') {
          newType = 'objetiva';
          newSubtype = 'verdadeiro_falso';
        } else {
          newType = 'discursiva';
        }
        
        setFormData({
          type: newType,
          subtype: newSubtype,
          enunciado: questionToEdit.enunciado || '',
          materia: questionToEdit.materia || '',
          conteudo: questionToEdit.conteudo || '',
          nivel: questionToEdit.nivel || 'Médio',
          options: questionToEdit.options || [],
          answer: questionToEdit.resposta || questionToEdit.answer || ''
        });
      } else {
        // Formato novo
        setFormData({
          type: questionToEdit.type || 'discursiva',
          subtype: questionToEdit.subtype || '',
          enunciado: questionToEdit.enunciado || '',
          materia: questionToEdit.materia || '',
          conteudo: questionToEdit.conteudo || '',
          nivel: questionToEdit.nivel || 'Médio',
          options: questionToEdit.options || [],
          answer: questionToEdit.answer || ''
        });
      }
    } else {
      // Resetar formulário para nova questão
      setFormData({
        type: 'discursiva',
        subtype: '',
        enunciado: '',
        materia: '',
        conteudo: '',
        nivel: 'Médio',
        options: [],
        answer: ''
      });
    }
  }, [questionToEdit, isOpen]);

  // Limpar conteúdo quando mudar a matéria
  useEffect(() => {
    if (!formData.materia) {
      setFormData(prev => ({ ...prev, conteudo: '' }));
    }
  }, [formData.materia]);

  // Limpar subtipo e opções quando mudar o tipo principal
  useEffect(() => {
    if (formData.type === 'discursiva') {
      setFormData(prev => ({ ...prev, subtype: '', options: [] }));
    }
  }, [formData.type]);

  // Obter conteúdos disponíveis para a matéria selecionada
  const availableContents = formData.materia 
    ? getContentsBySubject(formData.materia)
    : [];

  // Adicionar alternativa
  const handleAddOption = () => {
    const newOption = {
      id: Date.now(),
      text: '',
      isCorrect: false,
      order: formData.options.length + 1
    };
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, newOption]
    }));
  };

  // Remover alternativa
  const handleRemoveOption = (optionId) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter(opt => opt.id !== optionId)
    }));
  };

  // Atualizar texto da alternativa
  const handleUpdateOptionText = (optionId, text) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt =>
        opt.id === optionId ? { ...opt, text } : opt
      )
    }));
  };

  // Marcar alternativa como correta (para múltipla escolha)
  const handleToggleCorrect = (optionId) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt =>
        opt.id === optionId 
          ? { ...opt, isCorrect: !opt.isCorrect }
          : { ...opt, isCorrect: false } // Apenas uma correta
      )
    }));
  };

  // Atualizar resposta V/F
  const handleUpdateVFAnswer = (optionId, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt =>
        opt.id === optionId ? { ...opt, vfAnswer: value } : opt
      )
    }));
  };

  // Validações
  const validateForm = () => {
    if (!formData.enunciado.trim()) {
      alert('Por favor, preencha o enunciado.');
      return false;
    }
    if (!formData.materia.trim()) {
      alert('Por favor, selecione a matéria.');
      return false;
    }

    if (formData.type === 'objetiva') {
      if (!formData.subtype) {
        alert('Por favor, selecione o subtipo da questão objetiva.');
        return false;
      }

      if (formData.options.length < 2) {
        alert('Adicione pelo menos 2 alternativas.');
        return false;
      }

      // Validar que todas as alternativas têm texto
      const hasEmptyOptions = formData.options.some(opt => !opt.text.trim());
      if (hasEmptyOptions) {
        alert('Todas as alternativas devem ter texto.');
        return false;
      }

      // Validar gabarito conforme subtipo
      if (formData.subtype === 'multipla_escolha') {
        const hasCorrect = formData.options.some(opt => opt.isCorrect);
        if (!hasCorrect) {
          alert('Marque a alternativa correta.');
          return false;
        }
      } else if (formData.subtype === 'verdadeiro_falso') {
        const hasAllVF = formData.options.every(opt => opt.vfAnswer === 'V' || opt.vfAnswer === 'F');
        if (!hasAllVF) {
          alert('Defina se cada afirmação é Verdadeira (V) ou Falsa (F).');
          return false;
        }
      }
    } else {
      // Discursiva
      if (!formData.answer.trim()) {
        alert('Por favor, preencha o gabarito/resposta esperada.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Preparar dados para salvar
    const questionData = {
      type: formData.type,
      enunciado: formData.enunciado,
      materia: formData.materia,
      conteudo: formData.conteudo || '',
      nivel: formData.nivel,
      answer: formData.answer
    };

    if (formData.type === 'objetiva') {
      questionData.subtype = formData.subtype;
      questionData.options = formData.options;
      
      // Gerar resposta automática para o gabarito
      if (formData.subtype === 'multipla_escolha') {
        const correctOption = formData.options.find(opt => opt.isCorrect);
        questionData.answer = correctOption 
          ? `${correctOption.text} (Alternativa correta)`
          : '';
      } else if (formData.subtype === 'verdadeiro_falso') {
        const vfAnswers = formData.options.map((opt, idx) => 
          `${idx + 1}. ${opt.text}: ${opt.vfAnswer}`
        ).join('\n');
        questionData.answer = vfAnswers;
      } else {
        // Para outros subtipos, usar o campo answer manual
        questionData.answer = formData.answer || 'Ver alternativas';
      }
    }

    onSave(questionData);
    onClose();
  };

  if (!isOpen) return null;

  const isObjetiva = formData.type === 'objetiva';
  const isMultiplaEscolha = formData.subtype === 'multipla_escolha';
  const isVerdadeiroFalso = formData.subtype === 'verdadeiro_falso';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {questionToEdit ? 'Editar Questão' : 'Nova Questão'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tipo Principal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo Principal *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="discursiva"
                  checked={formData.type === 'discursiva'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, subtype: '', options: [] })}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-gray-700">Discursiva</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="objetiva"
                  checked={formData.type === 'objetiva'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, subtype: '' })}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-gray-700">Objetiva</span>
              </label>
            </div>
          </div>

          {/* Subtipo (apenas para objetiva) */}
          {isObjetiva && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtipo *
              </label>
              <select
                value={formData.subtype}
                onChange={(e) => setFormData({ ...formData, subtype: e.target.value, options: [] })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Selecione o subtipo</option>
                <option value="multipla_escolha">Múltipla Escolha</option>
                <option value="verdadeiro_falso">Verdadeiro/Falso</option>
                <option value="associacao">Associação</option>
                <option value="ordenacao">Ordenação</option>
                <option value="lacunas">Lacunas</option>
              </select>
            </div>
          )}

          {/* Enunciado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enunciado *
            </label>
            <textarea
              value={formData.enunciado}
              onChange={(e) => setFormData({ ...formData, enunciado: e.target.value })}
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Digite o enunciado da questão..."
            />
          </div>

          {/* Alerta se não houver matérias cadastradas */}
          {subjects.length === 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Nenhuma matéria cadastrada!</p>
                <p>Você precisa cadastrar matérias antes de criar questões. Use o botão "Configurar Matérias" no Dashboard.</p>
              </div>
            </div>
          )}

          {/* Matéria e Conteúdo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matéria *
              </label>
              <select
                value={formData.materia}
                onChange={(e) => setFormData({ ...formData, materia: e.target.value, conteudo: '' })}
                required
                disabled={subjects.length === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Selecione uma matéria</option>
                {getSubjectNames().map((subjectName) => (
                  <option key={subjectName} value={subjectName}>
                    {subjectName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conteúdo
              </label>
              <select
                value={formData.conteudo}
                onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                disabled={!formData.materia || availableContents.length === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!formData.materia 
                    ? 'Selecione uma matéria primeiro' 
                    : availableContents.length === 0
                    ? 'Nenhum conteúdo cadastrado'
                    : 'Selecione um conteúdo (opcional)'}
                </option>
                {availableContents.map((content) => (
                  <option key={content} value={content}>
                    {content}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nível */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nível *
            </label>
            <select
              value={formData.nivel}
              onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="Fácil">Fácil</option>
              <option value="Médio">Médio</option>
              <option value="Difícil">Difícil</option>
            </select>
          </div>

          {/* Alternativas (apenas para objetiva) */}
          {isObjetiva && formData.subtype && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Alternativas *
                </label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Alternativa
                </button>
              </div>

              {formData.options.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Clique em "Adicionar Alternativa" para começar.
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.options.map((option, index) => (
                    <div key={option.id} className="bg-white p-3 rounded-lg border border-gray-200 flex items-start gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => handleUpdateOptionText(option.id, e.target.value)}
                          placeholder={`Alternativa ${index + 1}...`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>

                      {/* Controles específicos por subtipo */}
                      <div className="flex items-center gap-2">
                        {isMultiplaEscolha && (
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="correct-option"
                              checked={option.isCorrect}
                              onChange={() => handleToggleCorrect(option.id)}
                              className="w-4 h-4 text-indigo-600"
                            />
                            <span className="text-xs text-gray-600">Correta</span>
                          </label>
                        )}

                        {isVerdadeiroFalso && (
                          <select
                            value={option.vfAnswer || ''}
                            onChange={(e) => handleUpdateVFAnswer(option.id, e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                            required
                          >
                            <option value="">V/F</option>
                            <option value="V">V</option>
                            <option value="F">F</option>
                          </select>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveOption(option.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remover alternativa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Gabarito/Resposta */}
          {formData.type === 'discursiva' || (isObjetiva && !isMultiplaEscolha && !isVerdadeiroFalso) ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gabarito/Resposta Esperada *
              </label>
              <textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                required={formData.type === 'discursiva' || (isObjetiva && !isMultiplaEscolha && !isVerdadeiroFalso)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={
                  formData.type === 'discursiva' 
                    ? 'Digite a resposta esperada ou gabarito...'
                    : 'Digite a resposta esperada (ordem, associação, etc.)...'
                }
              />
            </div>
          ) : null}

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {questionToEdit ? 'Salvar Alterações' : 'Salvar Questão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddQuestionModal;
