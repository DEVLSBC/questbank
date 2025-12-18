// Utilitário para gerar PDFs de provas usando jsPDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Gera um PDF com as questões selecionadas
 * @param {Array} questions - Array de questões selecionadas (já ordenadas pelo Modal)
 * @param {string} professorName - Nome do professor
 * @param {Object} userProfileData - Dados do perfil (nome, logoBase64)
 * @param {string} docTitle - Título do documento (Ex: "Prova de Recuperação")
 */
export const generatePDF = (questions, professorName, userProfileData = {}, docTitle = 'Lista de Exercícios') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Layout Grid: 20% (logo) / 80% (texto)
  const logoColumnWidth = pageWidth * 0.25; // 25% para dar margem visual
  const textColumnStart = logoColumnWidth + 10; 
  const leftMargin = 10;
  const logoMaxHeight = 40; 

  // --- CABEÇALHO ---
  
  // 1. Coluna Esquerda: Logo
  if (userProfileData.logoBase64) {
    try {
      const logoX = leftMargin + 5;
      const logoY = yPosition - 5;
      
      const logoWidth = Math.min(logoColumnWidth - 10, 40); 
      const logoHeight = logoMaxHeight;
      
      let imageFormat = 'PNG';
      if (userProfileData.logoBase64.startsWith('data:image/jpeg')) imageFormat = 'JPEG';
      
      doc.addImage(
        userProfileData.logoBase64,
        imageFormat,
        logoX,
        logoY,
        logoWidth,
        logoHeight
      );
    } catch (error) {
      console.error('Erro ao adicionar logo:', error);
    }
  }

  // 2. Coluna Direita: Informações de Texto
  const textX = textColumnStart;
  let textY = yPosition;

  // Título do Documento (Agora dinâmico!)
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(docTitle, textX, textY); // <--- Usa o título escolhido no Modal
  textY += 8;

  // Professor
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const professorDisplayName = professorName; 
  doc.text(`Professor(a): ${professorDisplayName}`, textX, textY);
  textY += 8;

  // Aluno
  doc.text('Nome do Aluno: ___________________________', textX, textY);
  textY += 8;

  // Matéria e Data
  // Pega a matéria da primeira questão ou deixa genérico se for misto
  const materia = questions.length > 0 ? questions[0].materia : 'Geral';
  const data = new Date().toLocaleDateString('pt-BR');
  
  doc.text(`Matéria: ${materia}`, textX, textY);
  doc.text(`Data: ${data}`, pageWidth - 20, textY, { align: 'right' });
  textY += 10;

  // Ajustar Y para o que for maior (Logo ou Texto)
  yPosition = Math.max(yPosition + logoMaxHeight, textY);

  // Linha separadora
  doc.setLineWidth(0.5);
  doc.setDrawColor(0); // Preto
  doc.line(leftMargin, yPosition, pageWidth - leftMargin, yPosition);
  yPosition += 10;

  // --- QUESTÕES ---
  doc.setFontSize(11);
  
  questions.forEach((question, index) => {
    // Verificar quebra de página
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    // Número da questão
    doc.setFont('helvetica', 'bold');
    doc.text(`Questão ${index + 1}:`, 20, yPosition);
    yPosition += 7;

    // Enunciado
    doc.setFont('helvetica', 'normal');
    const enunciadoLines = doc.splitTextToSize(question.enunciado, pageWidth - 40);
    
    enunciadoLines.forEach((line) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 25, yPosition);
      yPosition += 6;
    });

    // --- IMAGEM DA QUESTÃO ---
    if (question.questionImage) {
      try {
        const imgMaxHeight = 60; 
        const imgMaxWidth = 100;
        
        yPosition += 4;

        // Calcular Aspect Ratio
        const imgProps = doc.getImageProperties(question.questionImage);
        const imgRatio = imgProps.width / imgProps.height;
        
        let finalWidth = imgMaxWidth;
        let finalHeight = finalWidth / imgRatio;

        if (finalHeight > imgMaxHeight) {
          finalHeight = imgMaxHeight;
          finalWidth = finalHeight * imgRatio;
        }

        // Verificar espaço
        if (yPosition + finalHeight > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        doc.addImage(
          question.questionImage,
          'JPEG',
          35, // X
          yPosition, // Y
          finalWidth,
          finalHeight
        );
        
        yPosition += finalHeight + 5;

      } catch (err) {
        console.error("Erro na imagem da questão:", err);
      }
    }

    // --- ALTERNATIVAS (Objetiva) ---
    const isObjetiva = question.type === 'objetiva' || (!question.type && (question.tipo === 'Múltipla Escolha' || question.tipo === 'V/F'));
    
    if (isObjetiva && question.options && question.options.length > 0) {
      yPosition += 3;
      question.options.forEach((option, optIdx) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C...
        const optionText = option.text || '';
        const optionLines = doc.splitTextToSize(optionText, pageWidth - 50);

        doc.setFont('helvetica', 'normal');
        doc.text(`${optionLetter}) `, 30, yPosition);
        
        optionLines.forEach((line) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, 35, yPosition);
          yPosition += 6;
        });
        yPosition += 2;
      });
    }

    // --- ESPAÇO PARA RESPOSTA (Discursiva) ---
    const isDiscursiva = question.type === 'discursiva' || (!question.type && question.tipo === 'Aberta');
    
    if (isDiscursiva) {
      const sizeMap = { small: 40, medium: 80, large: 130 };
      const boxHeight = sizeMap[question.answerSize] || 80;
      const style = question.answerStyle || 'lines';
      const bottomMargin = 20;

      if (yPosition + boxHeight > pageHeight - bottomMargin) {
        doc.addPage();
        yPosition = 20; 
      }

      if (style === 'lines') {
        const lineSpacing = 8; 
        const numberOfLines = Math.floor(boxHeight / lineSpacing);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        for (let i = 1; i <= numberOfLines; i++) {
          const lineY = yPosition + (i * lineSpacing);
          doc.line(25, lineY, pageWidth - 25, lineY);
        }
      } else {
        // Espaço em branco
        doc.setDrawColor(245, 245, 245);
        doc.setLineWidth(0.5);
        doc.rect(25, yPosition, pageWidth - 50, boxHeight);
        
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        doc.text("Resolução / Cálculos", 27, yPosition + 5);
        
        doc.setTextColor(0);
        doc.setDrawColor(0);
        doc.setFontSize(11);
      }
      yPosition += boxHeight + 10;
    } else {
      yPosition += 8; // Espaço padrão entre questões objetivas
    }
  });

  // --- GABARITO ---
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  // Adiciona o título no Gabarito também
  doc.text('GABARITO - ' + docTitle, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  const gabaritoData = questions.map((question, index) => {
    let resposta = question.answer || question.resposta || '-';
    
    // Formatação inteligente da resposta
    if (question.type === 'objetiva' && question.options) {
      if (question.subtype === 'multipla_escolha') {
        const correctOption = question.options.find(opt => opt.isCorrect);
        if (correctOption) {
          const idx = question.options.indexOf(correctOption);
          resposta = `${String.fromCharCode(65 + idx)}) ${correctOption.text}`;
        }
      } else if (question.subtype === 'verdadeiro_falso') {
        resposta = question.options.map((opt, idx) => 
          `${idx + 1}.${opt.vfAnswer || '-'}`
        ).join(' | ');
      }
    }

    return [
      index + 1,
      question.materia,
      question.conteudo || '-',
      question.nivel,
      resposta
    ];
  });

  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'Matéria', 'Conteúdo', 'Nível', 'Resposta']],
    body: gabaritoData,
    theme: 'grid',
    headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 30 },
      2: { cellWidth: 40 },
      3: { cellWidth: 20 },
      4: { cellWidth: 'auto' }
    }
  });

  // Gera um nome de arquivo limpo baseado no título
  const cleanTitle = docTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`${cleanTitle}_${new Date().toISOString().split('T')[0]}.pdf`);
};