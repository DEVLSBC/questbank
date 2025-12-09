// Utilitário para gerar PDFs de provas usando jsPDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Gera um PDF com as questões selecionadas
 * @param {Array} questions - Array de questões selecionadas
 * @param {string} professorName - Nome do professor/instituição para o cabeçalho
 * @param {Object} userProfileData - Dados do perfil do usuário (nome, logoBase64)
 */
export const generatePDF = (questions, professorName, userProfileData = {}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Layout Grid: 20% (logo) / 80% (texto)
  const logoColumnWidth = pageWidth * 0.25; // 20% da largura
  const textColumnStart = logoColumnWidth + 20; // Início da coluna de texto (margem + 20%)
  const textColumnWidth = pageWidth * 0.75 - 40; // 80% menos margens
  const leftMargin = 10;
  const logoMaxHeight = 40; // Altura máxima da logo

  // Cabeçalho da Prova com Layout Grid
  // Coluna Esquerda (20%): Logo
  if (userProfileData.logoBase64) {
    try {
      // Calcular posição centralizada na coluna de 20%
      const logoX = leftMargin + (logoColumnWidth / 2);
      const logoY = yPosition - 10;
      
      // Usar dimensões fixas para garantir que não quebre o layout
      // A imagem já foi redimensionada para máximo 300px no upload
      const logoWidth = Math.min(logoColumnWidth - 10, 50); // Máximo 50px ou 20% - margem
      const logoHeight = logoMaxHeight;
      
      // Detectar formato da imagem pelo prefixo Base64
      let imageFormat = 'PNG';
      if (userProfileData.logoBase64.startsWith('data:image/jpeg')) {
        imageFormat = 'JPEG';
      } else if (userProfileData.logoBase64.startsWith('data:image/png')) {
        imageFormat = 'PNG';
      }
      
      doc.addImage(
        userProfileData.logoBase64,
        imageFormat,
        logoX - (logoWidth / 2), // Centralizar horizontalmente
        logoY,
        logoWidth,
        logoHeight
      );
    } catch (error) {
      console.error('Erro ao adicionar logo ao PDF:', error);
      // Continuar sem logo se houver erro
    }
  }

  // Coluna Direita (80%): Informações de Texto
  const textX = textColumnStart;
  let textY = yPosition;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Lista de Exercícios', textX, textY);
  textY += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const professorDisplayName = professorName;
  //const professorDisplayName = userProfileData.nome || professorName;
  doc.text(`Professor(a): ${professorDisplayName}`, textX, textY);
  textY += 8;

  // Linha em branco para nome do aluno
  doc.text('Nome do Aluno: ___________________________', textX, textY);
  textY += 8;

  // Matéria e Data
  const materia = questions.length > 0 ? questions[0].materia : 'Matéria';
  const data = new Date().toLocaleDateString('pt-BR');
  doc.text(`Matéria: ${materia}`, textX, textY);
  doc.text(`Data: ${data}`, pageWidth - 42.5, textY, { align: 'right' });
  textY += 10;

  // Ajustar yPosition para o maior valor (logo ou texto)
  yPosition = Math.max(yPosition + logoMaxHeight, textY);

  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(leftMargin, yPosition, pageWidth - leftMargin, yPosition);
  yPosition += 10;

  // Questões
  doc.setFontSize(11);
  questions.forEach((question, index) => {
    // Verificar se precisa de nova página
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

    // Exibir alternativas se for questão objetiva
    const isObjetiva = question.type === 'objetiva' || (!question.type && (question.tipo === 'Múltipla Escolha' || question.tipo === 'V/F'));
    const isMultiplaEscolha = question.subtype === 'multipla_escolha' || question.tipo === 'Múltipla Escolha';
    const isVerdadeiroFalso = question.subtype === 'verdadeiro_falso' || question.tipo === 'V/F';

    if (isObjetiva && question.options && question.options.length > 0) {
      yPosition += 3;
      question.options.forEach((option, optIdx) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C, D...
        const optionText = option.text || '';
        const optionLines = doc.splitTextToSize(optionText, pageWidth - 50);

        // Marcar alternativa correta (apenas no PDF do aluno, não no gabarito)
        doc.setFont('helvetica', 'normal');
        doc.text(`${optionLetter}) `, 30, yPosition);
        
        optionLines.forEach((line, lineIdx) => {
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

    // Informações adicionais (tipo, nível)
    //doc.setFontSize(9);
    //doc.setTextColor(100, 100, 100);
    //const tipoDisplay = question.type === 'objetiva' && question.subtype
    //  ? `Objetiva - ${question.subtype.replace('_', ' ')}`
    //  : question.type === 'discursiva'
    //  ? 'Discursiva'
    //  : question.tipo || 'N/A';
    //doc.text(`[${tipoDisplay} - ${question.nivel}]`, 25, yPosition);
    //doc.setTextColor(0, 0, 0);
    //yPosition += 10;

    // Espaço para resposta (se for questão discursiva)
    const isDiscursiva = question.type === 'discursiva' || (!question.type && question.tipo === 'Aberta');
    if (isDiscursiva) {
      doc.setLineWidth(0.1);
      doc.line(25, yPosition, pageWidth - 25, yPosition);
      yPosition += 5;
      doc.line(25, yPosition, pageWidth - 25, yPosition);
      yPosition += 5;
      doc.line(25, yPosition, pageWidth - 25, yPosition);
      yPosition += 10;
    } else {
      yPosition += 5;
    }
  });

  // Adicionar página para o Gabarito
  doc.addPage();
  yPosition = 20;

  // Cabeçalho do Gabarito
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('GABARITO', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Preparar dados do gabarito
  const gabaritoData = questions.map((question, index) => {
    let resposta = question.answer || question.resposta || '-';
    
    // Para questões objetivas, formatar resposta baseada no subtipo
    if (question.type === 'objetiva' && question.options) {
      if (question.subtype === 'multipla_escolha') {
        const correctOption = question.options.find(opt => opt.isCorrect);
        if (correctOption) {
          const optionIndex = question.options.indexOf(correctOption);
          const optionLetter = String.fromCharCode(65 + optionIndex);
          resposta = `${optionLetter}) ${correctOption.text}`;
        }
      } else if (question.subtype === 'verdadeiro_falso') {
        const vfAnswers = question.options.map((opt, idx) => 
          `${idx + 1}. ${opt.text}: ${opt.vfAnswer || '-'}`
        ).join(' | ');
        resposta = vfAnswers;
      } else {
        resposta = question.answer || 'Ver alternativas';
      }
    }

    const tipoDisplay = question.type === 'objetiva' && question.subtype
      ? `Objetiva - ${question.subtype.replace('_', ' ')}`
      : question.type === 'discursiva'
      ? 'Discursiva'
      : question.tipo || 'N/A';

    return [
      index + 1,
      question.materia,
      question.conteudo || '-',
      question.nivel,
      tipoDisplay,
      resposta
    ];
  });

  // Usar autoTable - com jspdf-autotable v5, usar a função diretamente
  autoTable(doc, {
    startY: yPosition,
    head: [['Questão', 'Matéria', 'Conteúdo', 'Nível', 'Tipo', 'Resposta']],
    body: gabaritoData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 40 },
      2: { cellWidth: 40 },
      3: { cellWidth: 25 },
      4: { cellWidth: 35 },
      5: { cellWidth: 'auto' }
    }
  });

  // Salvar o PDF
  const fileName = `Prova_${materia}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
