import React, { useState } from 'react';

const TextPreview = ({ text, onTextChange }) => {
  const [isEditable, setIsEditable] = useState(false);
  const [editedText, setEditedText] = useState(text);

  const handleEditToggle = () => {
    if (isEditable) {
      // Save changes
      onTextChange(editedText);
    }
    setIsEditable(!isEditable);
  };

  const handleTextChange = (e) => {
    setEditedText(e.target.value);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Document Content</h2>
        <button
          onClick={handleEditToggle}
          className={`px-4 py-1 rounded-md ${
            isEditable 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {isEditable ? 'Save' : 'Edit'}
        </button>
      </div>

      {isEditable ? (
        <textarea
          value={editedText}
          onChange={handleTextChange}
          className="w-full h-80 p-4 border rounded-md"
          placeholder="The extracted text will appear here. You can edit if needed."
        />
      ) : (
        <div className="w-full h-80 p-4 border rounded-md bg-gray-50 overflow-auto">
          {text ? (
            <pre className="whitespace-pre-wrap font-sans">{text}</pre>
          ) : (
            <p className="text-gray-500 italic">No content available</p>
          )}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500">
        <p>You can edit the extracted text if needed before generating the quiz.</p>
      </div>
    </div>
  );
};

export default TextPreview;