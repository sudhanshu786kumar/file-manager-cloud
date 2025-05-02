import React, { useState } from 'react';

const TextUpload = () => {
  const [text, setText] = useState('');

  const handleTextUpload = () => {
    // Logic to upload text
  };

  return (
    <div className="text-upload p-4 bg-gray-100 rounded-md">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your text here..."
        className="w-full p-2 border border-gray-300 rounded-md"
      />
      <button onClick={handleTextUpload} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md">Upload Text</button>
    </div>
  );
};

export default TextUpload;