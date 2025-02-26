import React, { useState, useRef, useEffect } from 'react';
import { FaPencilAlt, FaEraser, FaTrash, FaSave, FaFileAlt, FaPencilRuler, FaList, FaPlus, FaHistory, FaTrashAlt } from 'react-icons/fa';

const SudokuNotepad = ({ isOpen, onClose, isDarkMode, onSave, initialNotes = [], activeNoteId = null }) => {
  // ...existing state variables and refs...

  // Load saved notes from localStorage or use initialNotes
  const [notes, setNotes] = useState(() => {
    const savedNotes = localStorage.getItem('sudoku_notes_history');
    if (savedNotes) {
      try {
        return JSON.parse(savedNotes);
      } catch (e) {
        console.error("Failed to parse saved notes:", e);
      }
    }
    return initialNotes.length > 0 ? initialNotes : [];
  });

  const [currentNote, setCurrentNote] = useState(() => {
    // Find active note if specified, otherwise create a new one or use most recent
    if (activeNoteId) {
      const note = notes.find(note => note.id === activeNoteId);
      if (note) return note;
    }
    
    // Use most recent note or create new one
    return notes.length > 0 
      ? notes[0] 
      : { id: Date.now(), title: 'Untitled Note', content: '', type: 'text', timestamp: new Date().toISOString() };
  });

  const [showNotesList, setShowNotesList] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [activeTab, setActiveTab] = useState(() => currentNote?.type || 'text');
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const titleInputRef = useRef(null);

  // Set up canvas when tab changes or note changes
  useEffect(() => {
    if (activeTab === 'drawing' && isOpen) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Setup canvas
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      
      const context = canvas.getContext('2d');
      context.scale(2, 2);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = brushColor;
      context.lineWidth = brushSize;
      
      // If there's existing drawing content, load it
      if (currentNote.type === 'drawing' && currentNote.content) {
        const img = new Image();
        img.onload = () => {
          context.drawImage(img, 0, 0, canvas.width/2, canvas.height/2);
        };
        img.src = currentNote.content;
      } else {
        // Otherwise draw grid background
        // Set background color based on theme
        if (isDarkMode) {
          context.fillStyle = '#333';
          context.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          context.fillStyle = '#fff';
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Draw grid lines
        drawGridLines(context, isDarkMode);
      }
      
      contextRef.current = context;
    }
  }, [activeTab, isOpen, currentNote, brushColor, brushSize, isDarkMode]);

  // Focus title input when editing
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [editingTitle]);

  // Draw grid lines helper function
  const drawGridLines = (context, isDark) => {
    const gridSize = 20;
    const gridColor = isDark ? '#444' : '#ddd';
    
    context.strokeStyle = gridColor;
    context.lineWidth = 1;
    
    // Draw vertical lines
    for (let i = 0; i <= context.canvas.width/2; i += gridSize) {
      context.beginPath();
      context.moveTo(i, 0);
      context.lineTo(i, context.canvas.height/2);
      context.stroke();
    }
    
    // Draw horizontal lines
    for (let i = 0; i <= context.canvas.height/2; i += gridSize) {
      context.beginPath();
      context.moveTo(0, i);
      context.lineTo(context.canvas.width/2, i);
      context.stroke();
    }
    
    // Restore drawing settings
    context.strokeStyle = brushColor;
    context.lineWidth = brushSize;
  };

  // Handle drawing events
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const handleTabChange = (tab) => {
    // Save current work before switching tabs
    saveCurrentWork();
    setActiveTab(tab);
  };

  const saveCurrentWork = () => {
    // Get current content based on active tab
    let currentContent;
    if (activeTab === 'text') {
      currentContent = currentNote.content;
    } else if (activeTab === 'drawing' && canvasRef.current) {
      currentContent = canvasRef.current.toDataURL();
    }
    
    // Update current note with new content and tab type
    setCurrentNote(prevNote => ({
      ...prevNote,
      content: currentContent,
      type: activeTab,
      timestamp: new Date().toISOString()
    }));
  };

  const handleTextChange = (e) => {
    setCurrentNote(prevNote => ({
      ...prevNote,
      content: e.target.value,
      timestamp: new Date().toISOString()
    }));
  };

  const handleTitleChange = (e) => {
    setCurrentNote(prevNote => ({
      ...prevNote,
      title: e.target.value
    }));
  };

  const toggleTitleEdit = () => {
    if (editingTitle) {
      // Save the title when exiting edit mode
      const updatedNotes = notes.map(note => 
        note.id === currentNote.id ? { ...note, title: currentNote.title } : note
      );
      setNotes(updatedNotes);
      localStorage.setItem('sudoku_notes_history', JSON.stringify(updatedNotes));
    }
    setEditingTitle(!editingTitle);
  };

  const clearNotepad = () => {
    if (activeTab === 'text') {
      setCurrentNote(prevNote => ({ ...prevNote, content: '' }));
    } else if (activeTab === 'drawing') {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      
      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Redraw the background and grid
      if (isDarkMode) {
        context.fillStyle = '#333';
        context.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      drawGridLines(context, isDarkMode);
    }
  };

  const handleSave = () => {
    // Get latest content based on active tab
    let content;
    if (activeTab === 'text') {
      content = currentNote.content;
    } else if (activeTab === 'drawing' && canvasRef.current) {
      content = canvasRef.current.toDataURL();
    }
    
    // Update note with latest content
    const updatedNote = {
      ...currentNote,
      content,
      type: activeTab,
      timestamp: new Date().toISOString()
    };
    
    // If it's a new note (no id), create a new one
    if (!currentNote.id) {
      updatedNote.id = Date.now();
      updatedNote.title = updatedNote.title || `Note ${notes.length + 1}`;
      
      const updatedNotes = [updatedNote, ...notes];
      setNotes(updatedNotes);
      localStorage.setItem('sudoku_notes_history', JSON.stringify(updatedNotes));
    } else {
      // Update existing note
      const noteIndex = notes.findIndex(n => n.id === currentNote.id);
      
      if (noteIndex !== -1) {
        const updatedNotes = [...notes];
        updatedNotes[noteIndex] = updatedNote;
        setNotes(updatedNotes);
        localStorage.setItem('sudoku_notes_history', JSON.stringify(updatedNotes));
      } else {
        // If somehow the note isn't in our list, add it
        const updatedNotes = [updatedNote, ...notes];
        setNotes(updatedNotes);
        localStorage.setItem('sudoku_notes_history', JSON.stringify(updatedNotes));
      }
    }
    
    // Notify the parent component
    onSave(notes, updatedNote);
    onClose();
  };

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setBrushColor(newColor);
    
    if (contextRef.current) {
      contextRef.current.strokeStyle = newColor;
    }
  };

  const handleBrushSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setBrushSize(newSize);
    
    if (contextRef.current) {
      contextRef.current.lineWidth = newSize;
    }
  };

  const handleNoteClick = (note) => {
    // Save current work before switching notes
    saveCurrentWork();
    
    // Switch to the selected note
    setCurrentNote(note);
    setActiveTab(note.type);
    setShowNotesList(false);
  };

  const handleNewNote = () => {
    // Save current work
    saveCurrentWork();
    
    // Create a new note
    const newNote = { 
      id: Date.now(), 
      title: `Note ${notes.length + 1}`,
      content: '',
      type: 'text', 
      timestamp: new Date().toISOString()
    };
    
    setCurrentNote(newNote);
    setActiveTab('text');
    
    // Optionally add to notes list immediately
    setNotes([newNote, ...notes]);
  };

  const handleDeleteNote = (noteId) => {
    // Remove the note from the list
    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes);
    localStorage.setItem('sudoku_notes_history', JSON.stringify(updatedNotes));
    
    // If we deleted the current note, switch to another one
    if (currentNote.id === noteId) {
      if (updatedNotes.length > 0) {
        setCurrentNote(updatedNotes[0]);
        setActiveTab(updatedNotes[0].type);
      } else {
        // Create a new blank note if we deleted the last one
        const newNote = { 
          id: Date.now(), 
          title: 'New Note',
          content: '',
          type: 'text', 
          timestamp: new Date().toISOString()
        };
        setCurrentNote(newNote);
        setActiveTab('text');
      }
    }
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notepad-modal" onClick={onClose}>
      <div className="notepad-container" onClick={e => e.stopPropagation()}>
        <div className="notepad-header">
          <div className="notepad-title-container">
            {editingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                className="notepad-title-input"
                value={currentNote.title || ''}
                onChange={handleTitleChange}
                onBlur={toggleTitleEdit}
                onKeyPress={(e) => e.key === 'Enter' && toggleTitleEdit()}
              />
            ) : (
              <h3 className="notepad-title" onClick={toggleTitleEdit}>
                {activeTab === 'text' ? <FaFileAlt /> : <FaPencilRuler />}
                {currentNote.title || 'Untitled Note'}
              </h3>
            )}
            <span className="note-timestamp">{formatDate(currentNote.timestamp)}</span>
          </div>
          
          <div className="notepad-tabs">
            <button 
              className={`notepad-tab ${activeTab === 'text' ? 'active' : ''}`} 
              onClick={() => handleTabChange('text')}
            >
              <FaPencilAlt /> Text
            </button>
            <button 
              className={`notepad-tab ${activeTab === 'drawing' ? 'active' : ''}`}
              onClick={() => handleTabChange('drawing')}
            >
              <FaPencilRuler /> Draw
            </button>
          </div>
          
          <button className="close-notepad" onClick={onClose}>×</button>
        </div>
        
        <div className="notepad-content">
          {activeTab === 'text' ? (
            <textarea 
              className="text-notepad"
              value={currentNote.content || ''}
              onChange={handleTextChange}
              placeholder="Write your notes here..."
            />
          ) : (
            <div className="drawing-canvas-container">
              <canvas
                ref={canvasRef}
                className="drawing-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  const mouseEvent = new MouseEvent('mousedown', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                  });
                  canvasRef.current.dispatchEvent(mouseEvent);
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                  });
                  canvasRef.current.dispatchEvent(mouseEvent);
                }}
                onTouchEnd={() => {
                  const mouseEvent = new MouseEvent('mouseup', {});
                  canvasRef.current.dispatchEvent(mouseEvent);
                }}
              />
            </div>
          )}
          
          <div className="notepad-tools">
            {activeTab === 'drawing' && (
              <div className="drawing-tools">
                <input 
                  type="color"
                  className="color-picker"
                  value={brushColor}
                  onChange={handleColorChange}
                />
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={brushSize}
                  onChange={handleBrushSizeChange}
                  className="brush-size"
                />
                <span>{brushSize}px</span>
              </div>
            )}
            
            <div className="notepad-actions">
              <button className="notepad-button clear-button" onClick={clearNotepad}>
                <FaEraser /> Clear
              </button>
              <button className="notepad-button save-button" onClick={handleSave}>
                <FaSave /> Save
              </button>
              <button 
                className="notepad-button list-button" 
                onClick={() => setShowNotesList(!showNotesList)}
              >
                <FaList /> {notes.length} Notes
              </button>
              <button className="notepad-button new-button" onClick={handleNewNote}>
                <FaPlus /> New
              </button>
            </div>
          </div>
        </div>
        
        {showNotesList && (
          <div className="notes-list-container">
            <div className="notes-list-header">
              <h4>Your Notes ({notes.length})</h4>
              <button className="close-list" onClick={() => setShowNotesList(false)}>×</button>
            </div>
            {notes.length === 0 ? (
              <p className="no-notes-message">No saved notes yet</p>
            ) : (
              <ul className="notes-list">
                {notes.map((note) => (
                  <li 
                    key={note.id} 
                    className={`note-item ${currentNote.id === note.id ? 'selected' : ''}`}
                  >
                    <div className="note-item-content" onClick={() => handleNoteClick(note)}>
                      <span className="note-icon">
                        {note.type === 'text' ? <FaFileAlt /> : <FaPencilRuler />}
                      </span>
                      <div className="note-details">
                        <span className="note-title">{note.title || 'Untitled'}</span>
                        <span className="note-preview">
                          {note.type === 'text' 
                            ? (note.content?.substring(0, 30) || 'Empty note') + (note.content?.length > 30 ? '...' : '') 
                            : 'Drawing'}
                        </span>
                        <span className="note-date">{formatDate(note.timestamp)}</span>
                      </div>
                    </div>
                    <button 
                      className="delete-note" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      title="Delete note"
                    >
                      <FaTrashAlt />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SudokuNotepad;
