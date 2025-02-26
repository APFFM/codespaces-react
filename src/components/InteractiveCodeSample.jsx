import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import '../styles/InteractiveCodeSample.css';

/**
 * Interactive Code Sample component that allows users to see and edit code,
 * with live previews when appropriate.
 */
const InteractiveCodeSample = ({ 
  initialCode, 
  language, 
  title, 
  description, 
  canEdit = true, 
  isDarkMode = false,
  showLineNumbers = true,
  onCodeChange = () => {},
  LivePreview = null
}) => {
  const [code, setCode] = useState(initialCode);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewingFullscreen, setIsViewingFullscreen] = useState(false);
  
  const handleCodeChange = (e) => {
    setCode(e.target.value);
    onCodeChange(e.target.value);
  };
  
  const toggleEdit = () => {
    if (canEdit) {
      setIsEditing(!isEditing);
    }
  };
  
  const toggleFullscreen = () => {
    setIsViewingFullscreen(!isViewingFullscreen);
  };
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      alert("Code copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy code: ", err);
    }
  };
  
  return (
    <div className={`interactive-code-sample ${isViewingFullscreen ? 'fullscreen' : ''} ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="code-sample-header">
        <div className="code-title">
          <h3>{title}</h3>
          {description && <p className="code-description">{description}</p>}
        </div>
        <div className="code-actions">
          {canEdit && (
            <button 
              onClick={toggleEdit} 
              className="code-action-button"
              aria-label={isEditing ? "View code" : "Edit code"}
              title={isEditing ? "View code" : "Edit code"}
            >
              {isEditing ? "View" : "Edit"}
            </button>
          )}
          <button 
            onClick={copyToClipboard} 
            className="code-action-button"
            aria-label="Copy code to clipboard"
            title="Copy code"
          >
            Copy
          </button>
          <button 
            onClick={toggleFullscreen} 
            className="code-action-button"
            aria-label={isViewingFullscreen ? "Exit fullscreen" : "View fullscreen"}
            title={isViewingFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isViewingFullscreen ? "Exit" : "Expand"}
          </button>
        </div>
      </div>
      
      <div className="code-content">
        {isEditing ? (
          <textarea
            className="code-editor"
            value={code}
            onChange={handleCodeChange}
            spellCheck="false"
            aria-label="Code editor"
          />
        ) : (
          <SyntaxHighlighter 
            language={language} 
            style={isDarkMode ? tomorrow : prism}
            showLineNumbers={showLineNumbers}
            wrapLines={true}
          >
            {code}
          </SyntaxHighlighter>
        )}
      </div>
      
      {LivePreview && (
        <div className="code-preview">
          <h4>Preview</h4>
          <div className="preview-container">
            <LivePreview code={code} />
          </div>
        </div>
      )}
    </div>
  );
};

InteractiveCodeSample.propTypes = {
  initialCode: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  canEdit: PropTypes.bool,
  isDarkMode: PropTypes.bool,
  showLineNumbers: PropTypes.bool,
  onCodeChange: PropTypes.func,
  LivePreview: PropTypes.elementType
};

export default InteractiveCodeSample;
