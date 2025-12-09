// Página de Perfil - Permite alterar nome, senha e logo
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, User, Lock, Save, AlertCircle, CheckCircle, Image as ImageIcon, X } from 'lucide-react';

const Profile = () => {
  const { userData, updateUserName, updateUserPassword, updateUserLogo } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [nome, setNome] = useState(userData?.nome || '');
  const [logoPreview, setLogoPreview] = useState(userData?.logoBase64 || '');
  const [logoLoading, setLogoLoading] = useState(false);

  // Atualizar nome e logo quando userData mudar
  useEffect(() => {
    if (userData?.nome) {
      setNome(userData.nome);
    }
    if (userData?.logoBase64) {
      setLogoPreview(userData.logoBase64);
    } else {
      setLogoPreview('');
    }
  }, [userData]);

  // Função para redimensionar imagem usando canvas
  const resizeImage = (file, maxWidth = 300) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          // Calcular novas dimensões mantendo proporção
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          // Criar canvas para redimensionar
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Converter para Base64
          const base64 = canvas.toDataURL('image/png', 0.8);
          resolve(base64);
        };
        
        img.onerror = reject;
        img.src = e.target.result;
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Manipular seleção de arquivo
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Por favor, selecione apenas arquivos de imagem.' });
      return;
    }

    // Validar tamanho (máximo 5MB antes de redimensionar)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'A imagem é muito grande. Por favor, selecione uma imagem menor que 5MB.' });
      return;
    }

    try {
      setLogoLoading(true);
      setMessage({ type: '', text: '' });

      // Redimensionar e converter para Base64
      const base64 = await resizeImage(file, 300);
      
      // Atualizar preview
      setLogoPreview(base64);
      
      // Salvar no Firestore
      const result = await updateUserLogo(base64);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Logo atualizada com sucesso!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao atualizar logo.' });
        setLogoPreview(userData?.logoBase64 || '');
      }
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      setMessage({ type: 'error', text: 'Erro ao processar a imagem. Tente novamente.' });
      setLogoPreview(userData?.logoBase64 || '');
    } finally {
      setLogoLoading(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remover logo
  const handleRemoveLogo = async () => {
    if (!window.confirm('Deseja remover a logo?')) {
      return;
    }

    try {
      setLogoLoading(true);
      const result = await updateUserLogo('');
      
      if (result.success) {
        setLogoPreview('');
        setMessage({ type: 'success', text: 'Logo removida com sucesso!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao remover logo.' });
      }
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      setMessage({ type: 'error', text: 'Erro ao remover logo.' });
    } finally {
      setLogoLoading(false);
    }
  };
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Atualizar nome
  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      setMessage({ type: 'error', text: 'O nome não pode estar vazio.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    const result = await updateUserName(nome);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Nome atualizado com sucesso!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao atualizar nome.' });
    }
    
    setLoading(false);
  };

  // Atualizar senha
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validações
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setMessage({ type: 'error', text: 'Preencha todos os campos.' });
      return;
    }

    if (novaSenha.length < 6) {
      setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    setLoading(true);

    const result = await updateUserPassword(novaSenha);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao atualizar senha.' });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Meu Perfil</h1>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensagens */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Informações do Usuário */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-800">Informações Pessoais</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={userData?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">O email não pode ser alterado</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF
                </label>
                <input
                  type="text"
                  value={userData?.cpf || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">O CPF não pode ser alterado</p>
              </div>
            </div>
          </div>

          {/* Logo Personalizada */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <ImageIcon className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-800">Logo Personalizada</h2>
            </div>

            <div className="space-y-4">
              {/* Preview da logo atual */}
              {logoPreview && (
                <div className="flex items-center gap-4">
                  <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                    <img
                      src={logoPreview}
                      alt="Logo atual"
                      className="max-w-[200px] max-h-[100px] object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={logoLoading}
                    className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Remover Logo
                  </button>
                </div>
              )}

              {/* Input de upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {logoPreview ? 'Alterar Logo' : 'Adicionar Logo'}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={logoLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Formatos aceitos: JPG, PNG, GIF. A imagem será redimensionada automaticamente para máximo 300px de largura.
                </p>
              </div>

              {logoLoading && (
                <p className="text-sm text-gray-500">Processando imagem...</p>
              )}
            </div>
          </div>

          {/* Alterar Nome */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-800">Alterar Nome</h2>
            </div>

            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Seu nome completo"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Salvando...' : 'Salvar Nome'}
              </button>
            </form>
          </div>

          {/* Alterar Senha */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-800">Alterar Senha</h2>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label htmlFor="senhaAtual" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha Atual
                </label>
                <input
                  id="senhaAtual"
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Digite sua senha atual"
                />
              </div>

              <div>
                <label htmlFor="novaSenha" className="block text-sm font-medium text-gray-700 mb-2">
                  Nova Senha
                </label>
                <input
                  id="novaSenha"
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nova Senha
                </label>
                <input
                  id="confirmarSenha"
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Confirme sua nova senha"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Salvando...' : 'Salvar Senha'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;

