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
  doc,
  writeBatch, // <--- Importante para salvar em lote
  getDocs     // <--- Importante para buscar as questões antigas
} from 'firebase/firestore';
import { db } from '../config/firebase'; // Mantive o seu caminho de importação

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
        console.error('Erro no listener de matérias:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Criar nova matéria (Renomeei para addSubject para combinar com o ManageSubjects.jsx)
  const addSubject = async (name, contents = []) => {
    if (!userId) throw new Error('Usuário não autenticado');
    if (!name.trim()) throw new Error('Nome da matéria é obrigatório');

    try {
      const newSubject = {
        uid: userId,
        name: name.trim(),
        contents: contents || [],
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'subjects'), newSubject);
      return { success: true, id: docRef.id };
    } catch (err) {
      console.error('Erro ao criar matéria:', err);
      throw err;
    }
  };

  // --- ATUALIZAÇÃO EM CASCATA (MATÉRIA) ---
  const updateSubject = async (subjectId, newName, newContents, oldName) => {
    if (!userId) throw new Error('Usuário não autenticado');
    if (!newName.trim()) throw new Error('Nome da matéria é obrigatório');

    try {
      // Inicia um lote de escrita (Batch)
      const batch = writeBatch(db);

      // 1. Atualiza o documento da Matéria
      const subjectRef = doc(db, 'subjects', subjectId);
      batch.update(subjectRef, {
        name: newName.trim(),
        contents: newContents || [],
        updatedAt: new Date().toISOString()
      });

      // 2. Se o NOME da matéria mudou, atualiza todas as questões
      if (oldName && newName.trim() !== oldName) {
        console.log(`Renomeando cascata: ${oldName} -> ${newName}`);
        
        // Busca todas as questões que usam o nome antigo
        const q = query(
          collection(db, 'questions'), 
          where('uid', '==', userId),
          where('materia', '==', oldName)
        );
        
        const querySnapshot = await getDocs(q);
        
        // Adiciona a atualização de cada questão ao lote
        querySnapshot.forEach((document) => {
          batch.update(document.ref, { materia: newName.trim() });
        });
      }

      // 3. Salva tudo de uma vez
      await batch.commit();
      return true;
    } catch (err) {
      console.error('Erro ao atualizar matéria e cascata:', err);
      throw err;
    }
  };

  // --- ATUALIZAÇÃO EM CASCATA (CONTEÚDO) ---
  // Função nova para corrigir erros como "Logarítmo" -> "Logaritmo"
  const renameContentGlobal = async (subjectId, subjectName, oldContent, newContent, currentContents) => {
    if (!userId) return false;

    try {
      const batch = writeBatch(db);

      // 1. Atualiza a lista dentro da Matéria (no documento subjects)
      const updatedContents = currentContents.map(c => c === oldContent ? newContent : c);
      const subjectRef = doc(db, 'subjects', subjectId);
      batch.update(subjectRef, { 
        contents: updatedContents,
        updatedAt: new Date().toISOString()
      });

      // 2. Busca e atualiza todas as QUESTÕES com esse conteúdo antigo
      const q = query(
        collection(db, 'questions'),
        where('uid', '==', userId),
        where('materia', '==', subjectName), // Garante que é na matéria certa
        where('conteudo', '==', oldContent)
      );

      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((document) => {
        batch.update(document.ref, { conteudo: newContent });
      });

      // 3. Executa
      await batch.commit();
      return true;
    } catch (err) {
      console.error("Erro ao renomear conteúdo globalmente:", err);
      return false;
    }
  };

  // Excluir matéria
  const deleteSubject = async (subjectId) => {
    try {
      await deleteDoc(doc(db, 'subjects', subjectId));
      return { success: true };
    } catch (err) {
      console.error('Erro ao excluir matéria:', err);
      throw err;
    }
  };

  // Helpers
  const getContentsBySubject = (subjectName) => {
    const subject = subjects.find(s => s.name === subjectName);
    return subject?.contents || [];
  };

  const getSubjectNames = () => {
    return subjects.map(s => s.name).sort();
  };

  return {
    subjects,
    loading,
    error,
    addSubject,     // Nota: Mudei o nome interno de createSubject para addSubject para bater com o front
    updateSubject,
    deleteSubject,
    renameContentGlobal, // Nova função exportada
    getContentsBySubject,
    getSubjectNames
  };
};