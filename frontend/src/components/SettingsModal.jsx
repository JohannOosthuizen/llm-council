import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import './SettingsModal.css';

export default function SettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [councilModels, setCouncilModels] = useState([]);
  const [chairmanModel, setChairmanModel] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settings, models] = await Promise.all([
        api.getSettings(),
        api.getModels()
      ]);
      setApiKey(settings.api_key || '');
      setCouncilModels(settings.council_models || []);
      setChairmanModel(settings.chairman_model || '');
      setAvailableModels(models);
    } catch (e) {
      console.error("Failed to load settings data", e);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      await api.saveSettings({
        api_key: apiKey,
        council_models: councilModels,
        chairman_model: chairmanModel
      });
      onClose();
    } catch (e) {
      console.error("Failed to save", e);
    }
  };

  const updateCouncilModel = (index, value) => {
    const newModels = [...councilModels];
    newModels[index] = value;
    setCouncilModels(newModels);
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        {loading ? (
          <div className="settings-loading">Loading...</div>
        ) : (
          <div className="settings-content">
            <div className="settings-group">
              <label>OpenRouter API Key</label>
              <input 
                type="password" 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="settings-input"
              />
              <span className="settings-hint">Leave blank to use the server default key.</span>
            </div>

            <div className="settings-group">
              <label>Chairman Model</label>
              <ModelSelect 
                value={chairmanModel} 
                onChange={setChairmanModel} 
                models={availableModels} 
              />
            </div>

            <div className="settings-group">
              <label>Council Members</label>
              {councilModels.map((model, idx) => (
                <div key={idx} className="council-member-row">
                  <span>Member {idx + 1}</span>
                  <ModelSelect 
                    value={model} 
                    onChange={val => updateCouncilModel(idx, val)} 
                    models={availableModels} 
                  />
                </div>
              ))}
            </div>

            <button className="save-btn" onClick={handleSave}>Save Settings</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ModelSelect({ value, onChange, models }) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // When value changes, we don't necessarily want to update search
  // because that would filter the list to just the current value on first click.
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredModels = [...models]
    .sort((a, b) => a.id.localeCompare(b.id))
    .filter(m => {
      const term = search.toLowerCase();
      return m.id.toLowerCase().includes(term) || 
             (m.name && m.name.toLowerCase().includes(term));
    });

  // Limit rendering for performance if not searching
  const displayedModels = search ? filteredModels : filteredModels.slice(0, 200);

  const getProvider = (id) => id.split('/')[0];

  return (
    <div className="model-select-wrapper" ref={wrapperRef}>
      <input 
        type="text" 
        value={isOpen ? search : (value || '')}
        onChange={e => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          setSearch('');
        }}
        className="settings-input"
        placeholder="Search any OpenRouter model..."
      />
      {isOpen && (
        <div className="model-dropdown">
          {displayedModels.map(m => (
            <div 
              key={m.id} 
              className={`model-option ${m.id === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(m.id);
                setSearch('');
                setIsOpen(false);
              }}
            >
              <div className="model-option-id-row">
                <span className="model-option-provider">{getProvider(m.id)}</span>
                <span className="model-option-id">{m.id.split('/')[1] || m.id}</span>
              </div>
              <div className="model-option-name">{m.name}</div>
            </div>
          ))}
          {displayedModels.length === 0 && <div className="model-option-empty">No models found</div>}
          {!search && filteredModels.length > 200 && (
            <div className="model-option-hint">Type to search all {filteredModels.length} models...</div>
          )}
        </div>
      )}
    </div>
  );
}
