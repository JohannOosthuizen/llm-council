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
  const [search, setSearch] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch(value || '');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const filteredModels = models.filter(m => 
    m.id.toLowerCase().includes(search.toLowerCase()) || 
    (m.name && m.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="model-select-wrapper" ref={wrapperRef}>
      <input 
        type="text" 
        value={search}
        onChange={e => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className="settings-input"
        placeholder="Search for a model..."
      />
      {isOpen && (
        <div className="model-dropdown">
          {filteredModels.map(m => (
            <div 
              key={m.id} 
              className="model-option"
              onClick={() => {
                onChange(m.id);
                setSearch(m.id);
                setIsOpen(false);
              }}
            >
              <div className="model-option-id">{m.id}</div>
              <div className="model-option-name">{m.name}</div>
            </div>
          ))}
          {filteredModels.length === 0 && <div className="model-option-empty">No models found</div>}
        </div>
      )}
    </div>
  );
}
