// Componente para gerenciar matérias e conteúdos
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubjects } from '../../hooks/useSubjects';
import { 
  X, 
  Plus, 
  Trash2, 
  BookOpen, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Pencil,
  XCircle
} from 'lucide-react';

const ManageSubjects = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const {
    subjects,
    loading,
    createSubject,
    updateSubject,
    addContent,
    removeContent,
    deleteSubject
  } = useSubjects(currentUser?.uid);

  const [newSubjectName, setNewSubjectName] = useState('');
  const [newContentName, setNewContentName] = useState({});
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [deletingSubject, setDeletingSubject] = useState(null);
  
  // Estados de edição
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingContents, setEditingContents] = useState([]);

  if (!isOpen) return null;

  // Iniciar edição de matéria
  const handleStartEdit = (subject) => {
    setEditingId(subject.id);
    setEditingName(subject.name);
    setEditingContents([...(subject.contents || [])]);
    setExpandedSubject(subject.id);
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingContents([]);
  };

  // Atualizar conteúdo editável
  const handleUpdateEditingContent = (index, newValue) => {
    const updated = [...editingContents];
    updated[index] = newValue;
    setEditingContents(updated);
  };

  // Remover conteúdo durante edição
  const handleRemoveEditingContent = (index) => {
    const updated = editingContents.filter((_, i) => i !== index);
    setEditingContents(updated);
  };

  // Adicionar novo conteúdo durante edição
  const handleAddEditingContent = () => {
    setEditingContents([...editingContents, '']);
  };

  // Salvar edição
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingName.trim()) {
      setMessage({ type: 'error', text: 'Digite o nome da matéria.' });
      return;
    }

    // Validar que todos os conteúdos têm texto
    const hasEmptyContents = editingContents.some(c => !c.trim());
    if (hasEmptyContents) {
      setMessage({ type: 'error', text: 'Todos os conteúdos devem ter texto. Remova os vazios ou preencha-os.' });
      return;
    }

    try {
      await updateSubject(editingId, editingName.trim(), editingContents.map(c => c.trim()));
      handleCancelEdit();
      setMessage({ type: 'success', text: 'Matéria atualizada com sucesso!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erro ao atualizar matéria.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  // Criar nova matéria
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) {
      setMessage({ type: 'error', text: 'Digite o nome da matéria.' });
      return;
    }

    try {
      await createSubject(newSubjectName.trim());
      setNewSubjectName('');
      setMessage({ type: 'success', text: 'Matéria criada com sucesso!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erro ao criar matéria.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  // Adicionar conteúdo
  const handleAddContent = async (subjectId) => {
    const contentName = newContentName[subjectId];
    if (!contentName?.trim()) {
      setMessage({ type: 'error', text: 'Digite o nome do conteúdo.' });
      return;
    }

    try {
      await addContent(subjectId, contentName.trim());
      setNewContentName({ ...newContentName, [subjectId]: '' });
      setMessage({ type: 'success', text: 'Conteúdo adicionado com sucesso!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erro ao adicionar conteúdo.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  // Remover conteúdo
  const handleRemoveContent = async (subjectId, contentName) => {
    if (!window.confirm(`Deseja remover o conteúdo "${contentName}"?`)) {
      return;
    }

    try {
      await removeContent(subjectId, contentName);
      setMessage({ type: 'success', text: 'Conteúdo removido com sucesso!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erro ao remover conteúdo.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  // Excluir matéria
  const handleDeleteSubject = async (subjectId, subjectName) => {
    if (!window.confirm(`Deseja excluir a matéria "${subjectName}" e todos os seus conteúdos?`)) {
      return;
    }

    try {
      setDeletingSubject(subjectId);
      await deleteSubject(subjectId);
      setMessage({ type: 'success', text: 'Matéria excluída com sucesso!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      if (expandedSubject === subjectId) {
        setExpandedSubject(null);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erro ao excluir matéria.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setDeletingSubject(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-800">Gerenciar Matérias e Conteúdos</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mensagens */}
        {message.text && (
          <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Formulário para criar/editar matéria */}
          <div className={`rounded-lg p-4 ${editingId ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'}`}>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              {editingId ? (
                <>
                  <Pencil className="w-5 h-5 text-indigo-600" />
                  Editar Matéria
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-indigo-600" />
                  Nova Matéria
                </>
              )}
            </h3>
            <form onSubmit={editingId ? handleSaveEdit : handleCreateSubject} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editingId ? editingName : newSubjectName}
                  onChange={(e) => editingId ? setEditingName(e.target.value) : setNewSubjectName(e.target.value)}
                  placeholder="Ex: Matemática, Português, História..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={!!editingId && false}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  {editingId ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Criar
                    </>
                  )}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancelar
                  </button>
                )}
              </div>

              {/* Conteúdos editáveis (apenas durante edição) */}
              {editingId && (
                <div className="mt-3 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Conteúdos:
                  </label>
                  {editingContents.map((content, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={content}
                        onChange={(e) => handleUpdateEditingContent(index, e.target.value)}
                        placeholder={`Conteúdo ${index + 1}...`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveEditingContent(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remover conteúdo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddEditingContent}
                    className="w-full px-3 py-2 text-sm text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Conteúdo
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Lista de matérias */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Carregando matérias...
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Nenhuma matéria cadastrada.</p>
              <p className="text-sm mt-1">Crie sua primeira matéria acima.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Cabeçalho da matéria */}
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-semibold text-gray-800">{subject.name}</h4>
                      <span className="text-sm text-gray-500">
                        ({subject.contents?.length || 0} conteúdo{subject.contents?.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedSubject(
                          expandedSubject === subject.id ? null : subject.id
                        )}
                        className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        disabled={editingId === subject.id}
                      >
                        {expandedSubject === subject.id ? 'Ocultar' : 'Ver Conteúdos'}
                      </button>
                      <button
                        onClick={() => handleStartEdit(subject)}
                        disabled={editingId === subject.id || !!editingId}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Editar matéria"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(subject.id, subject.name)}
                        disabled={deletingSubject === subject.id || editingId === subject.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Excluir matéria"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Conteúdos (expandido) - apenas se não estiver editando */}
                  {expandedSubject === subject.id && editingId !== subject.id && (
                    <div className="p-4 bg-white space-y-3">
                      {/* Lista de conteúdos */}
                      {subject.contents && subject.contents.length > 0 ? (
                        <div className="space-y-2">
                          {subject.contents.map((content, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">{content}</span>
                              </div>
                              <button
                                onClick={() => handleRemoveContent(subject.id, content)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Remover conteúdo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-2">
                          Nenhum conteúdo cadastrado ainda.
                        </p>
                      )}

                      {/* Formulário para adicionar conteúdo */}
                      <div className="pt-2 border-t border-gray-200">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleAddContent(subject.id);
                          }}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            value={newContentName[subject.id] || ''}
                            onChange={(e) => setNewContentName({
                              ...newContentName,
                              [subject.id]: e.target.value
                            })}
                            placeholder="Ex: Álgebra, Geometria, Trigonometria..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                          />
                          <button
                            type="submit"
                            className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 text-sm"
                          >
                            <Plus className="w-4 h-4" />
                            Adicionar
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageSubjects;

