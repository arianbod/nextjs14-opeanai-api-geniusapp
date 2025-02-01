import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Copy,
  Maximize2,
  Minimize2,
  Play,
  Edit2,
  FilePlus,
  X,
  RotateCw,
  Download,
  Undo,
  Redo,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ThemeToggle from '@/components/sidebar/ThemeToggle';

const CodeBlock = ({ language, codeContent, onAddToNote }) => {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState(codeContent);
  const [modalView, setModalView] = useState('preview'); // 'code' or 'preview' on mobile

  // For undo/redo functionality in edit mode
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // In edit mode, force expansion.
  const isExpanded = isEditing ? true : expanded;

  const copyCode = () => {
    const codeToCopy = isEditing ? editedCode : codeContent;
    navigator.clipboard.writeText(codeToCopy);
    toast.success('Code copied!');
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const toggleEdit = () => setIsEditing((prev) => !prev);

  const handleAddToNote = () => {
    const codeToAdd = isEditing ? editedCode : codeContent;
    if (onAddToNote) {
      onAddToNote(codeToAdd);
    }
    toast.success('Code added to note!');
  };

  const resetCode = () => {
    setEditedCode(codeContent);
    setUndoStack([]);
    setRedoStack([]);
    toast.success('Code reset to original');
  };

  // Download function – choose file extension based on language.
  const getFileExtension = (lang) => {
    if (lang === 'html') return 'html';
    if (lang === 'css') return 'css';
    if (lang === 'javascript') return 'js';
    if (lang === 'typescript') return 'ts';
    if (lang === 'python') return 'py';
    return 'txt';
  };

  const downloadCode = () => {
    const codeToDownload = isEditing ? editedCode : codeContent;
    const ext = getFileExtension(language);
    const blob = new Blob([codeToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Undo/Redo handlers for edit mode
  const handleTextChange = (e) => {
    const newVal = e.target.value;
    setUndoStack((prev) => [...prev, editedCode]);
    setRedoStack([]);
    setEditedCode(newVal);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const lastState = undoStack[undoStack.length - 1];
    setUndoStack(undoStack.slice(0, -1));
    setRedoStack((prev) => [editedCode, ...prev]);
    setEditedCode(lastState);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[0];
    setRedoStack(redoStack.slice(1));
    setUndoStack((prev) => [...prev, editedCode]);
    setEditedCode(nextState);
  };

  const currentTheme = document.documentElement.getAttribute('data-theme');
  const syntaxStyle = currentTheme === 'dracula' ? vscDarkPlus : vs;

  // Append a script to disable links in the preview.
  const disableLinksScript = `<script>
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function(e){ e.preventDefault(); });
  });
});
<\/script>`;

  // Modal content rendered via portal.
  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white dark:bg-gray-900 w-full h-full md:w-11/12 md:h-5/6 rounded shadow-lg overflow-hidden">
        {/* Modal Toolbar */}
        <div className="p-2 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={resetCode}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Reset code"
            >
              <RotateCw size={16} className="text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={handleAddToNote}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Add code to note (save your changes)"
            >
              <FilePlus size={16} className="text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={toggleEdit}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Toggle edit mode"
            >
              <Edit2
                size={16}
                className={`text-gray-600 dark:text-gray-300 ${isEditing ? 'text-blue-600' : ''
                  }`}
              />
            </button>
            {isEditing && (
              <>
                <button
                  onClick={handleUndo}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="Undo"
                >
                  <Undo size={16} className="text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={handleRedo}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="Redo"
                >
                  <Redo size={16} className="text-gray-600 dark:text-gray-300" />
                </button>
              </>
            )}
            <button
              onClick={downloadCode}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Download code"
            >
              <Download size={16} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile toggle for modal view */}
            <div className="md:hidden flex gap-1">
              <button
                onClick={() => setModalView('code')}
                className={`p-1 rounded ${modalView === 'code'
                    ? 'bg-blue-500 text-white'
                    : 'bg-transparent text-gray-600'
                  }`}
                title="Show code"
              >
                Code
              </button>
              <button
                onClick={() => setModalView('preview')}
                className={`p-1 rounded ${modalView === 'preview'
                    ? 'bg-blue-500 text-white'
                    : 'bg-transparent text-gray-600'
                  }`}
                title="Show preview"
              >
                Preview
              </button>
            </div>
            <ThemeToggle />
            <button
              onClick={closeModal}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Close preview"
            >
              <X size={16} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
        <div className="h-full flex flex-col md:flex-row">
          {/* Code view */}
          <div className={`flex-1 overflow-auto p-2 ${modalView === 'code' ? 'block' : 'hidden'} md:block`}>
            {isEditing ? (
              <textarea
                value={editedCode}
                onChange={handleTextChange}
                className="w-full p-4 font-mono text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded"
                style={{ minHeight: '200px' }}
              />
            ) : (
              <SyntaxHighlighter
                language={language || 'text'}
                style={syntaxStyle}
                showLineNumbers
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  fontSize: '0.875rem',
                }}
                wrapLongLines
              >
                {codeContent}
              </SyntaxHighlighter>
            )}
          </div>
          {/* Preview view */}
          <div className={`flex-1 overflow-auto p-2 ${modalView === 'preview' ? 'block' : 'hidden'} md:block`}>
            <iframe
              srcDoc={(isEditing ? editedCode : codeContent) + disableLinksScript}
              sandbox="allow-scripts"
              title="Code Execution Preview"
              className="w-full h-full border rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const modalPortal =
    typeof window !== 'undefined' ? ReactDOM.createPortal(modalContent, document.body) : null;

  return (
    <div className="code-block-container my-4">
      <div className={`relative overflow-auto transition-all duration-300 ${isExpanded ? 'max-h-full' : 'max-h-60'}`}>
        {/* Sticky toolbar */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-t">
          <div className="flex gap-2">
            <button onClick={copyCode} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600" title="Copy code">
              <Copy size={16} className="text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={openModal}
              className={`p-1 rounded ${showModal ? 'bg-blue-500 text-white' : 'bg-transparent'}`}
              title="Preview code"
            >
              <Play size={16} />
            </button>
            <button onClick={toggleEdit} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600" title="Toggle edit mode">
              <Edit2 size={16} className={`text-gray-600 dark:text-gray-300 ${isEditing ? 'text-blue-600' : ''}`} />
            </button>
            {isEditing && (
              <>
                <button onClick={handleUndo} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600" title="Undo">
                  <Undo size={16} className="text-gray-600 dark:text-gray-300" />
                </button>
                <button onClick={handleRedo} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600" title="Redo">
                  <Redo size={16} className="text-gray-600 dark:text-gray-300" />
                </button>
              </>
            )}
            <button onClick={downloadCode} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600" title="Download code">
              <Download size={16} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <button
            onClick={() => !isEditing && setExpanded(!expanded)}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <Minimize2 size={16} className="text-gray-600 dark:text-gray-300" />
            ) : (
              <Maximize2 size={16} className="text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>
        {/* Code display */}
        {isEditing ? (
          <textarea
            value={editedCode}
            onChange={handleTextChange}
            className="w-full p-4 font-mono text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded"
            style={{ minHeight: '200px' }}
          />
        ) : (
          <SyntaxHighlighter
            language={language || 'text'}
            style={syntaxStyle}
            showLineNumbers
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '0.875rem',
            }}
            wrapLongLines
          >
            {codeContent}
          </SyntaxHighlighter>
        )}
        {!isExpanded && !isEditing && (
          <div
            className="fade-overlay pointer-events-none absolute bottom-0 left-0 right-0 h-12"
            style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.8), transparent)' }}
          />
        )}
      </div>
      {showModal && modalPortal}
    </div>
  );
};

export default CodeBlock;
