import React from 'react';
import { jsPDF } from 'jspdf';

const QuizExport = ({ questions }) => {
  const exportAsJSON = () => {
    const dataStr = JSON.stringify(questions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    // Create download link and trigger download
    const exportName = `quiz-${new Date().toISOString().slice(0, 10)}.json`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataUri);
    downloadAnchorNode.setAttribute('download', exportName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const exportAsPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Generated Quiz', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });
    
    let yPos = 35;
    
    // Add questions and options
    questions.forEach((question, index) => {
      // Check if we need a new page
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      
      // Question
      doc.setFont(undefined, 'bold');
      doc.text(`${index + 1}. ${question.question}`, 10, yPos);
      yPos += 8;
      
      // Options
      doc.setFont(undefined, 'normal');
      question.options.forEach((option) => {
        const marker = option === question.answer ? '✓ ' : '  ';
        doc.text(`${marker}${option}`, 15, yPos);
        yPos += 7;
      });
      
      yPos += 5;
    });
    
    // Save PDF
    doc.save(`quiz-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">Export Quiz</h2>
      
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <p className="mb-4 text-gray-700">
          You can download the quiz in the following formats:
        </p>
        
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={exportAsJSON}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export as JSON
          </button>
          
          <button
            onClick={exportAsPDF}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export as PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizExport;