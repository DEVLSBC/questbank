import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy, // Opcional: para ordenar por data
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../config/firebase'; // Verifique se o caminho está correto

export const useQuestions = (uid) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Query para buscar as questões do usuário
    const q = query(
      collection(db, 'questions'),
      where('uid', '==', uid)
      // Se tiver um campo de data, você pode descomentar abaixo:
      // orderBy('createdAt', 'desc') 
    );

    // O SEGREDO ESTÁ AQUI: onSnapshot (Tempo Real)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const questionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setQuestions(questionsData);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar questões em tempo real:", error);
      setLoading(false);
    });

    // Limpa o listener quando sair da tela
    return () => unsubscribe();
  }, [uid]);

  // Função para deletar questão
  const deleteQuestion = async (id) => {
    try {
      await deleteDoc(doc(db, 'questions', id));
      return true;
    } catch (error) {
      console.error("Erro ao deletar questão:", error);
      return false;
    }
  };

  return { questions, loading, deleteQuestion };
};