// Dashboard - Tela principal com listagem e filtros de questões
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubjects } from '../hooks/useSubjects';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import AddQuestionModal from '../components/questions/AddQuestionModal';
import PDFModal from '../components/questions/PDFModal';
import ManageSubjects from '../components/subjects/ManageSubjects';
import { generatePDF } from '../utils/pdfGenerator';
import { 
  Plus, 
  LogOut, 
  User, 
  Search, 
  Edit, 
  Trash2, 
  FileText, 
  Filter,
  X,
  BookOpen
} from 'lucide-react';

const Dashboard = () => {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const { subjects, getContentsBySubject, getSubjectNames } = useSubjects(currentUser?.uid);
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados do modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [isManageSubjectsOpen, setIsManageSubjectsOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Estados dos filtros
  const [filters, setFilters] = useState({
    materia: '',
    conteudo: '',
    nivel: '',
    tipo: ''
  });

  // Buscar questões do usuário logado
  const fetchQuestions = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      // Query simples com where - ordenação feita no cliente para evitar necessidade de índice composto
      const q = query(
        collection(db, 'questions'),
        where('uid', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const questionsData = [];
      querySnapshot.forEach((doc) => {
        questionsData.push({ id: doc.id, ...doc.data() });
      });
      // Ordenar por data de criação (mais recentes primeiro)
      questionsData.sort((a, b) => {
        const dateA = a.createdAt || '';
        const dateB = b.createdAt || '';
        return dateB.localeCompare(dateA);
      });
      setQuestions(questionsData);
      setFilteredQuestions(questionsData);
    } catch (error) {
      console.error('Erro ao buscar questões:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchQuestions();
    }
  }, [currentUser]);

  // Limpar conteúdo quando mudar matéria no filtro
  useEffect(() => {
    if (!filters.materia) {
      setFilters(prev => ({ ...prev, conteudo: '' }));
    }
  }, [filters.materia]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...questions];

    if (filters.materia) {
      filtered = filtered.filter(q => q.materia === filters.materia);
    }
    if (filters.conteudo) {
      filtered = filtered.filter(q => q.conteudo === filters.conteudo);
    }
    if (filters.nivel) {
      filtered = filtered.filter(q => q.nivel === filters.nivel);
    }
    if (filters.tipo) {
      filtered = filtered.filter(q => {
        // Compatibilidade com formato antigo e novo
        if (q.type === 'objetiva' && q.subtype) {
          const tipoFormatado = `Objetiva - ${q.subtype.replace('_', ' ')}`;
          return tipoFormatado === filters.tipo;
        } else if (q.type === 'discursiva') {
          return filters.tipo === 'Discursiva';
        } else if (q.tipo) {
          return q.tipo === filters.tipo;
        }
        return false;
      });
    }

    setFilteredQuestions(filtered);
    setSelectedQuestions([]); // Limpar seleção ao filtrar
  }, [filters, questions]);

  // Salvar questão (criar ou editar)
  const handleSaveQuestion = async (questionData) => {
    try {
      if (editingQuestion) {
        // Editar questão existente
        await updateDoc(doc(db, 'questions', editingQuestion.id), {
          ...questionData,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Criar nova questão
        await addDoc(collection(db, 'questions'), {
          ...questionData,
          uid: currentUser.uid,
          createdAt: new Date().toISOString()
        });
      }
      await fetchQuestions();
      setEditingQuestion(null);
    } catch (error) {
      console.error('Erro ao salvar questão:', error);
      alert('Erro ao salvar questão. Tente novamente.');
    }
  };

  // Excluir questão
  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta questão?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'questions', questionId));
      await fetchQuestions();
    } catch (error) {
      console.error('Erro ao excluir questão:', error);
      alert('Erro ao excluir questão. Tente novamente.');
    }
  };

  // Editar questão
  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setIsAddModalOpen(true);
  };

  // Selecionar/deselecionar questão
  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  // Selecionar todas/deselecionar todas
  const toggleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredQuestions.map(q => q.id));
    }
  };

  // Gerar PDF
  const handleGeneratePDF = (professorName) => {
    const selectedQuestionsData = filteredQuestions.filter(q => 
      selectedQuestions.includes(q.id)
    );
    // Passar dados do usuário incluindo logoBase64
    const userProfileData = {
      nome: userData?.nome || professorName,
      logoBase64: userData?.logoBase64 || null
    };
    generatePDF(selectedQuestionsData, professorName, userProfileData);
    setSelectedQuestions([]);
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      materia: '',
      conteudo: '',
      nivel: '',
      tipo: ''
    });
  };

  // Logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Obter conteúdos disponíveis para a matéria selecionada no filtro
  const availableFilterContents = filters.materia 
    ? getContentsBySubject(filters.materia)
    : [];

  const uniqueNiveis = ['Fácil', 'Médio', 'Difícil'];
  
  // Tipos dinâmicos baseados nas questões existentes
  const uniqueTipos = [
    ...new Set(questions.map(q => {
      if (q.type === 'objetiva' && q.subtype) {
        return `Objetiva - ${q.subtype.replace('_', ' ')}`;
      } else if (q.type === 'discursiva') {
        return 'Discursiva';
      } else if (q.tipo) {
        // Compatibilidade com formato antigo
        return q.tipo;
      }
      return null;
    }).filter(Boolean))
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Banco de Questões</h1>
              <p className="text-sm text-gray-600">Bem-vindo, {userData?.nome || 'Usuário'}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="w-5 h-5" />
                Perfil
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barra de Ações */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setEditingQuestion(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nova Questão
            </button>
            <button
              onClick={() => setIsManageSubjectsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              Configurar Matérias
            </button>
          </div>

          {selectedQuestions.length > 0 && (
            <button
              onClick={() => setIsPDFModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileText className="w-5 h-5" />
              Gerar Prova ({selectedQuestions.length})
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-800">Filtros</h2>
            {(filters.materia || filters.conteudo || filters.nivel || filters.tipo) && (
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
              >
                <X className="w-4 h-4" />
                Limpar
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Matéria
              </label>
              <select
                value={filters.materia}
                onChange={(e) => setFilters({ ...filters, materia: e.target.value, conteudo: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                <option value="">Todas</option>
                {getSubjectNames().map((subjectName) => (
                  <option key={subjectName} value={subjectName}>
                    {subjectName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conteúdo
              </label>
              <select
                value={filters.conteudo}
                onChange={(e) => setFilters({ ...filters, conteudo: e.target.value })}
                disabled={!filters.materia || availableFilterContents.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!filters.materia 
                    ? 'Selecione uma matéria primeiro' 
                    : availableFilterContents.length === 0
                    ? 'Nenhum conteúdo disponível'
                    : 'Todos'}
                </option>
                {availableFilterContents.map((content) => (
                  <option key={content} value={content}>
                    {content}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nível
              </label>
              <select
                value={filters.nivel}
                onChange={(e) => setFilters({ ...filters, nivel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                <option value="">Todos</option>
                {uniqueNiveis.map(nivel => (
                  <option key={nivel} value={nivel}>{nivel}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={filters.tipo}
                onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                <option value="">Todos</option>
                {uniqueTipos.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Listagem de Questões */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Carregando questões...
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-2">Nenhuma questão encontrada.</p>
              <p className="text-sm">Clique em "Nova Questão" para começar.</p>
            </div>
          ) : (
            <>
              {/* Checkbox para selecionar todas */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.length === filteredQuestions.length && filteredQuestions.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Selecionar todas ({filteredQuestions.length})
                  </span>
                </label>
              </div>

              {/* Lista de questões */}
              <div className="divide-y divide-gray-200">
                {filteredQuestions.map((question) => (
                  <div
                    key={question.id}
                    className={`p-6 hover:bg-gray-50 transition-colors ${
                      selectedQuestions.includes(question.id) ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.includes(question.id)}
                        onChange={() => toggleQuestionSelection(question.id)}
                        className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-gray-800 font-medium mb-2">
                              {question.enunciado}
                            </p>
                            
                            {/* Exibir alternativas se for questão objetiva */}
                            {question.type === 'objetiva' && question.options && question.options.length > 0 && (
                              <div className="mt-3 mb-2 space-y-1">
                                {question.options.map((option, idx) => (
                                  <div key={option.id || idx} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="font-medium text-gray-500">
                                      {String.fromCharCode(65 + idx)})
                                    </span>
                                    <span className={option.isCorrect ? 'font-semibold text-green-700' : ''}>
                                      {option.text}
                                      {option.isCorrect && (
                                        <span className="ml-2 text-xs text-green-600">✓ Correta</span>
                                      )}
                                      {option.vfAnswer && (
                                        <span className="ml-2 text-xs text-gray-500">
                                          ({option.vfAnswer === 'V' ? 'Verdadeiro' : 'Falso'})
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {question.materia}
                              </span>
                              {question.conteudo && (
                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {question.conteudo}
                                </span>
                              )}
                              <span className={`px-2 py-1 rounded ${
                                question.nivel === 'Fácil' ? 'bg-green-100 text-green-800' :
                                question.nivel === 'Médio' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {question.nivel}
                              </span>
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                {question.type === 'objetiva' 
                                  ? `Objetiva${question.subtype ? ` - ${question.subtype.replace('_', ' ')}` : ''}`
                                  : question.type === 'discursiva'
                                  ? 'Discursiva'
                                  : question.tipo || 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleEditQuestion(question)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modais */}
      <AddQuestionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveQuestion}
        questionToEdit={editingQuestion}
      />

      <PDFModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        onGenerate={handleGeneratePDF}
        questionCount={selectedQuestions.length}
      />

      <ManageSubjects
        isOpen={isManageSubjectsOpen}
        onClose={() => setIsManageSubjectsOpen(false)}
      />
    </div>
  );
};

export default Dashboard;

