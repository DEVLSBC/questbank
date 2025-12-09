// Hook customizado para gerenciar matérias e conteúdos do Firestore
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const useSubjects = (userId) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listener em tempo real para matérias do usuário
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setSubjects([]);
      return;
    }

    setLoading(true);
    setError(null);

    // Configurar query
    const q = query(
      collection(db, 'subjects'),
      where('uid', '==', userId)
    );

    // Configurar listener em tempo real
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        try {
          const subjectsData = [];
          querySnapshot.forEach((docSnapshot) => {
            subjectsData.push({ id: docSnapshot.id, ...docSnapshot.data() });
          });
          // Ordenar por nome
          subjectsData.sort((a, b) => a.name.localeCompare(b.name));
          setSubjects(subjectsData);
          setError(null);
        } catch (err) {
          console.error('Erro ao processar snapshot:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        // Callback de erro do onSnapshot
        console.error('Erro no listener de matérias:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup: desinscrever quando componente desmontar ou userId mudar
    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Função de busca manual (mantida para compatibilidade, mas não é mais necessária)
  const fetchSubjects = async () => {
    // Esta função não é mais necessária pois o listener atualiza automaticamente
    // Mantida apenas para compatibilidade caso seja chamada em algum lugar
    console.warn('fetchSubjects() não é mais necessária. Os dados são atualizados automaticamente via onSnapshot.');
  };

  // Criar nova matéria
  const createSubject = async (name) => {
    if (!userId) throw new Error('Usuário não autenticado');
    if (!name.trim()) throw new Error('Nome da matéria é obrigatório');

    try {
      const newSubject = {
        uid: userId,
        name: name.trim(),
        contents: [],
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'subjects'), newSubject);
      // Não precisa chamar fetchSubjects() - o listener atualiza automaticamente
      return { success: true, id: docRef.id };
    } catch (err) {
      console.error('Erro ao criar matéria:', err);
      throw err;
    }
  };

  // Adicionar conteúdo a uma matéria
  const addContent = async (subjectId, contentName) => {
    if (!contentName.trim()) throw new Error('Nome do conteúdo é obrigatório');

    try {
      const subject = subjects.find(s => s.id === subjectId);
      if (!subject) throw new Error('Matéria não encontrada');

      // Verificar se o conteúdo já existe
      if (subject.contents && subject.contents.includes(contentName.trim())) {
        throw new Error('Este conteúdo já existe nesta matéria');
      }

      const updatedContents = [...(subject.contents || []), contentName.trim()];
      await updateDoc(doc(db, 'subjects', subjectId), {
        contents: updatedContents,
        updatedAt: new Date().toISOString()
      });
      // Não precisa chamar fetchSubjects() - o listener atualiza automaticamente
      return { success: true };
    } catch (err) {
      console.error('Erro ao adicionar conteúdo:', err);
      throw err;
    }
  };

  // Remover conteúdo de uma matéria
  const removeContent = async (subjectId, contentName) => {
    try {
      const subject = subjects.find(s => s.id === subjectId);
      if (!subject) throw new Error('Matéria não encontrada');

      const updatedContents = (subject.contents || []).filter(
        c => c !== contentName
      );
      await updateDoc(doc(db, 'subjects', subjectId), {
        contents: updatedContents,
        updatedAt: new Date().toISOString()
      });
      // Não precisa chamar fetchSubjects() - o listener atualiza automaticamente
      return { success: true };
    } catch (err) {
      console.error('Erro ao remover conteúdo:', err);
      throw err;
    }
  };

  // Atualizar matéria (nome e conteúdos)
  const updateSubject = async (subjectId, newName, newContents) => {
    if (!userId) throw new Error('Usuário não autenticado');
    if (!newName.trim()) throw new Error('Nome da matéria é obrigatório');

    try {
      const subject = subjects.find(s => s.id === subjectId);
      if (!subject) throw new Error('Matéria não encontrada');

      // Validar que o novo nome não conflita com outras matérias (exceto a atual)
      const nameExists = subjects.some(
        s => s.id !== subjectId && s.name.toLowerCase() === newName.trim().toLowerCase()
      );
      if (nameExists) {
        throw new Error('Já existe uma matéria com este nome');
      }

      await updateDoc(doc(db, 'subjects', subjectId), {
        name: newName.trim(),
        contents: newContents || [],
        updatedAt: new Date().toISOString()
      });
      // Não precisa chamar fetchSubjects() - o listener atualiza automaticamente
      return { success: true };
    } catch (err) {
      console.error('Erro ao atualizar matéria:', err);
      throw err;
    }
  };

  // Excluir matéria
  const deleteSubject = async (subjectId) => {
    try {
      await deleteDoc(doc(db, 'subjects', subjectId));
      // Não precisa chamar fetchSubjects() - o listener atualiza automaticamente
      return { success: true };
    } catch (err) {
      console.error('Erro ao excluir matéria:', err);
      throw err;
    }
  };

  // Obter conteúdos de uma matéria específica
  const getContentsBySubject = (subjectName) => {
    const subject = subjects.find(s => s.name === subjectName);
    return subject?.contents || [];
  };

  // Obter lista de nomes de matérias
  const getSubjectNames = () => {
    return subjects.map(s => s.name).sort();
  };

  return {
    subjects,
    loading,
    error,
    createSubject,
    updateSubject,
    addContent,
    removeContent,
    deleteSubject,
    fetchSubjects,
    getContentsBySubject,
    getSubjectNames
  };
};

