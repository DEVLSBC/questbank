// Dashboard - Tela principal com listagem e filtros de questões
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubjects } from '../hooks/useSubjects';
import { useQuestions } from '../hooks/useQuestions';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import AddQuestionModal from '../components/questions/AddQuestionModal';
import PDFModal from '../components/questions/PDFModal';
import ManageSubjects from '../components/subjects/ManageSubjects';
import { generatePDF } from '../utils/pdfGenerator';
import { 
  Plus, 
  LogOut, 
  User, 
  Edit, 
  Trash2, 
  FileText, 
  Filter,
  X,
  BookOpen,
  ChevronLeft,  // Novo ícone
  ChevronRight  // Novo ícone
} from 'lucide-react';

const Dashboard = () => {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  
  // Hooks customizados
  const { getContentsBySubject, getSubjectNames } = useSubjects(currentUser?.uid);
  const { questions, loading, deleteQuestion } = useQuestions(currentUser?.uid);

  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  
  // --- CONFIGURAÇÃO DA PAGINAÇÃO ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Mude para 5 se preferir exibir menos
  
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

  // Limpar conteúdo quando mudar matéria no filtro
  useEffect(() => {
    if (!filters.materia) {
      setFilters(prev => ({ ...prev, conteudo: '' }));
    }
  }, [filters.materia]);

  // Aplicar filtros e RESETAR paginação
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

    // Ordenar por data de criação (mais recentes primeiro) se houver campo createdAt, 
    // ou manter a ordem que veio do hook (que já deve vir ordenada se configurado)
    // Aqui garantimos a ordenação no front para a paginação funcionar bem (Novos no topo)
    filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; // Decrescente
    });

    setFilteredQuestions(filtered);
    setCurrentPage(1); // Importante: Volta para a página 1 quando filtra
  }, [filters, questions]);

  // --- CÁLCULOS DA PAGINAÇÃO ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  // Salvar questão
  const handleSaveQuestion = async (questionData) => {
    try {
      if (editingQuestion) {
        await updateDoc(doc(db, 'questions', editingQuestion.id), {
          ...questionData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'questions'), {
          ...questionData,
          uid: currentUser.uid,
          createdAt: new Date().toISOString()
        });
      }
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
      await deleteQuestion(questionId);
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

  // Selecionar todas (apenas da página atual ou todas filtradas? Geralmente todas filtradas é melhor para gerar prova)
  const toggleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredQuestions.map(q => q.id));
    }
  };

  // Gerar PDF
  // Gerar PDF (Agora recebe a lista ordenada do Modal)
  const handleGeneratePDF = (professorName, documentTitle, orderedQuestions) => {
    // Passar dados do usuário incluindo logoBase64
    const userProfileData = {
      nome: userData?.nome || professorName,
      logoBase64: userData?.logoBase64 || null
    };
    
    // AQUI ESTÁ O TRUQUE: Usamos o título do modal no lugar do nome fixo "Lista..."
    // Precisaremos de um pequeno ajuste no pdfGenerator para aceitar título, 
    // mas por enquanto passamos no lugar do professorName ou criamos um parametro novo.
    // Vamos passar orderedQuestions DIRETO para o gerador.
    
    generatePDF(orderedQuestions, professorName, userProfileData, documentTitle);
    
    setSelectedQuestions([]);
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilters({ materia: '', conteudo: '', nivel: '', tipo: '' });
  };

  // Logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const availableFilterContents = filters.materia ? getContentsBySubject(filters.materia) : [];
  const uniqueNiveis = ['Fácil', 'Médio', 'Difícil'];
  const uniqueTipos = [
    ...new Set(questions.map(q => {
      if (q.type === 'objetiva' && q.subtype) return `Objetiva - ${q.subtype.replace('_', ' ')}`;
      if (q.type === 'discursiva') return 'Discursiva';
      if (q.tipo) return q.tipo;
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
              <button onClick={() => navigate('/profile')} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <User className="w-5 h-5" /> Perfil
              </button>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut className="w-5 h-5" /> Sair
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
              onClick={() => { setEditingQuestion(null); setIsAddModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" /> Nova Questão
            </button>
            <button
              onClick={() => setIsManageSubjectsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <BookOpen className="w-5 h-5" /> Configurar Matérias
            </button>
          </div>

          {selectedQuestions.length > 0 && (
            <button
              onClick={() => setIsPDFModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileText className="w-5 h-5" /> Gerar Prova ({selectedQuestions.length})
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-800">Filtros</h2>
            {(filters.materia || filters.conteudo || filters.nivel || filters.tipo) && (
              <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
                <X className="w-4 h-4" /> Limpar
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Selects de filtro (mantidos iguais) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matéria</label>
              <select value={filters.materia} onChange={(e) => setFilters({ ...filters, materia: e.target.value, conteudo: '' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Todas</option>
                {getSubjectNames().map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo</label>
              <select value={filters.conteudo} onChange={(e) => setFilters({ ...filters, conteudo: e.target.value })} disabled={!filters.materia} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100">
                <option value="">{!filters.materia ? 'Selecione uma matéria' : 'Todos'}</option>
                {availableFilterContents.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
              <select value={filters.nivel} onChange={(e) => setFilters({ ...filters, nivel: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Todos</option>
                {uniqueNiveis.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={filters.tipo} onChange={(e) => setFilters({ ...filters, tipo: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Todos</option>
                {uniqueTipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Listagem de Questões */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando questões...</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-2">Nenhuma questão encontrada.</p>
              <p className="text-sm">Clique em "Nova Questão" para começar.</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
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
                <span className="text-xs text-gray-500">
                   Total: {filteredQuestions.length} questões
                </span>
              </div>

              <div className="divide-y divide-gray-200">
                {/* AQUI ESTÁ A MUDANÇA: Usamos currentQuestions (paginado) em vez de filteredQuestions */}
                {currentQuestions.map((question) => (
                  <div key={question.id} className={`p-6 hover:bg-gray-50 transition-colors ${selectedQuestions.includes(question.id) ? 'bg-indigo-50' : ''}`}>
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
                            <p className="text-gray-800 font-medium mb-2">{question.enunciado}</p>
                            
                            {question.questionImage && (
                              <div className="mb-3">
                                <img src={question.questionImage} alt="Imagem da questão" className="max-h-32 rounded border border-gray-200" />
                              </div>
                            )}
                            
                            {/* Renderização das alternativas (código mantido) */}
                            {question.type === 'objetiva' && question.options && question.options.length > 0 && (
                              <div className="mt-3 mb-2 space-y-1">
                                {question.options.map((option, idx) => (
                                  <div key={option.id || idx} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="font-medium text-gray-500">{String.fromCharCode(65 + idx)})</span>
                                    <span className={option.isCorrect ? 'font-semibold text-green-700' : ''}>
                                      {option.text}
                                      {option.isCorrect && <span className="ml-2 text-xs text-green-600">✓ Correta</span>}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{question.materia}</span>
                              {question.conteudo && <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">{question.conteudo}</span>}
                              <span className={`px-2 py-1 rounded ${question.nivel === 'Fácil' ? 'bg-green-100 text-green-800' : question.nivel === 'Médio' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{question.nivel}</span>
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                {question.type === 'objetiva' ? `Objetiva${question.subtype ? ` - ${question.subtype.replace('_', ' ')}` : ''}` : 'Discursiva'}
                              </span>
                              {question.answerStyle === 'blank' && <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded border border-gray-300">Espaço em Branco</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button onClick={() => handleEditQuestion(question)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Editar"><Edit className="w-5 h-5" /></button>
                            <button onClick={() => handleDeleteQuestion(question.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* --- COMPONENTE DE PAGINAÇÃO (RODAPÉ) --- */}
              {filteredQuestions.length > itemsPerPage && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> até <span className="font-medium">{Math.min(indexOfLastItem, filteredQuestions.length)}</span> de <span className="font-medium">{filteredQuestions.length}</span> resultados
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Anterior
                    </button>
                    <span className="flex items-center px-3 text-sm font-medium text-gray-700">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próximo
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modais */}
      <AddQuestionModal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setEditingQuestion(null); }} onSave={handleSaveQuestion} questionToEdit={editingQuestion} />
      <PDFModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        onGenerate={handleGeneratePDF}
        // Agora passamos os OBJETOS das questões, não só o número
        selectedQuestions={filteredQuestions.filter(q => selectedQuestions.includes(q.id))}
      />
      <ManageSubjects isOpen={isManageSubjectsOpen} onClose={() => setIsManageSubjectsOpen(false)} />
    </div>
  );
};

export default Dashboard;