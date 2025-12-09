# Banco de Questões

Aplicação web para professores cadastrarem questões e gerarem provas em PDF.

## 🚀 Tecnologias

- **Frontend:** React (Vite) + JavaScript
- **Estilização:** Tailwind CSS + Lucide React (ícones)
- **Backend/Database:** Firebase v9 (Authentication + Firestore)
- **Geração de PDF:** jsPDF e jspdf-autotable
- **Roteamento:** React Router DOM

## 📋 Funcionalidades

### Autenticação
- ✅ Cadastro com Nome Completo, CPF, Email e Senha
- ✅ Login com Email e Senha
- ✅ Sistema Multi-tenant lógico (cada professor vê apenas suas questões)
- ✅ Página de Perfil para alterar Nome e Senha

### Gerenciamento de Questões (CRUD)
- ✅ Criar questões com Enunciado, Matéria, Conteúdo, Nível, Tipo e Resposta
- ✅ Listar e filtrar questões por Matéria, Conteúdo, Nível e Tipo
- ✅ Editar questões existentes
- ✅ Excluir questões

### Geração de Provas (PDF)
- ✅ Seleção múltipla de questões com checkboxes
- ✅ Geração de PDF com cabeçalho personalizado
- ✅ PDF contém questões numeradas e formatadas
- ✅ Gabarito automático na segunda página

## 🛠️ Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative Authentication (Email/Password)
3. Crie um banco Firestore
4. Copie o arquivo `.env.example` para `.env` e preencha com suas credenciais:

```env
VITE_FIREBASE_API_KEY=sua_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

### 3. Configurar Regras do Firestore

No Firebase Console, vá em Firestore Database > Rules e cole o conteúdo do arquivo `firestore.rules`.

### 4. Executar o projeto

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 📁 Estrutura de Pastas

```
src/
├── components/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── questions/
│   │   ├── AddQuestionModal.jsx
│   │   └── PDFModal.jsx
│   └── ProtectedRoute.jsx
├── contexts/
│   └── AuthContext.jsx
├── pages/
│   ├── Dashboard.jsx
│   └── Profile.jsx
├── config/
│   └── firebase.js
├── utils/
│   └── pdfGenerator.js
├── App.jsx
└── main.jsx
```

## 🔒 Segurança

O sistema implementa um modelo Multi-tenant lógico onde:
- Cada usuário só pode criar, ler, atualizar e deletar suas próprias questões
- As regras do Firestore garantem que os dados sejam isolados por usuário
- A autenticação é gerenciada pelo Firebase Authentication

## 📦 Deploy no GitHub Pages

Para fazer deploy no GitHub Pages:

1. Instale o plugin do Vite:
```bash
npm install --save-dev gh-pages
```

2. Adicione no `package.json`:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. Configure o `vite.config.js`:
```js
export default defineConfig({
  base: '/nome-do-repositorio/',
  plugins: [react()],
})
```

4. Execute:
```bash
npm run deploy
```

## 📝 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.
