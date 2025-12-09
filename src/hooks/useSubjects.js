// Hook customizado para gerenciar matérias e conteúdos do Firestore
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
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

  // Buscar todas as matérias do usuário
  const fetchSubjects = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const q = query(
        collection(db, 'subjects'),
        where('uid', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const subjectsData = [];
      querySnapshot.forEach((docSnapshot) => {
        subjectsData.push({ id: docSnapshot.id, ...docSnapshot.data() });
      });
      // Ordenar por nome
      subjectsData.sort((a, b) => a.name.localeCompare(b.name));
      setSubjects(subjectsData);
    } catch (err) {
      console.error('Erro ao buscar matérias:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
      await fetchSubjects();
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
      await fetchSubjects();
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
      await fetchSubjects();
      return { success: true };
    } catch (err) {
      console.error('Erro ao remover conteúdo:', err);
      throw err;
    }
  };

  // Excluir matéria
  const deleteSubject = async (subjectId) => {
    try {
      await deleteDoc(doc(db, 'subjects', subjectId));
      await fetchSubjects();
      return { success: true };
    } catch (err) {
      console.error('Erro ao excluir matéria:', err);
      throw err;
    }
  };

  // Buscar matérias quando userId mudar
  useEffect(() => {
    if (userId) {
      fetchSubjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
    addContent,
    removeContent,
    deleteSubject,
    fetchSubjects,
    getContentsBySubject,
    getSubjectNames
  };
};

