import { useState, useEffect } from 'react';
import './ChecklistDescription.css';

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface ChecklistDescriptionProps {
  description: string;
  demandId: string | number;
  onUpdate?: (updatedDescription: string) => void;
  isExpanded?: boolean;
  className?: string;
}

const ChecklistDescription = ({ 
  description, 
  demandId, 
  onUpdate, 
  isExpanded = false,
  className = '' 
}: ChecklistDescriptionProps) => {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [textParts, setTextParts] = useState<string[]>([]);


  // Parse da descrição para extrair itens de checklist
  useEffect(() => {
    parseDescription(description);
  }, [description]);

  const parseDescription = (desc: string) => {
    // Regex mais robusta para detectar itens de checklist
    const checklistRegex = /-\s*\[([xX\s])\]\s*(.+)/g;
    const parts: string[] = [];
    const items: ChecklistItem[] = [];
    let lastIndex = 0;
    let match;

    while ((match = checklistRegex.exec(desc)) !== null) {
      
      // Adiciona texto antes do item de checklist
      if (match.index > lastIndex) {
        const beforeText = desc.substring(lastIndex, match.index).trim();
        if (beforeText) {
          parts.push(beforeText);
        }
      }

      // Cria item de checklist
      const itemId = `${demandId}-${items.length}`;
      const checkboxState = match[1].trim();
      const isChecked = checkboxState.toLowerCase() === 'x';
      const itemText = match[2].trim();

      items.push({
        id: itemId,
        text: itemText,
        checked: isChecked
      });

      parts.push(`CHECKLIST_ITEM_${items.length - 1}`);
      lastIndex = checklistRegex.lastIndex;
    }

    // Adiciona texto restante após o último item
    if (lastIndex < desc.length) {
      const remainingText = desc.substring(lastIndex).trim();
      if (remainingText) {
        parts.push(remainingText);
      }
    }

    // Se não há itens de checklist, trata como texto normal
    if (items.length === 0) {
      parts.push(desc);
    }

    setChecklistItems(items);
    setTextParts(parts);
  };

  const handleCheckboxChange = (itemId: string, checked: boolean) => {
    const updatedItems = checklistItems.map(item =>
      item.id === itemId ? { ...item, checked } : item
    );
    setChecklistItems(updatedItems);

    // Reconstrói a descrição com os novos estados
    if (onUpdate) {
      const updatedDescription = reconstructDescription(updatedItems);
      onUpdate(updatedDescription);
    }
  };

  const reconstructDescription = (items: ChecklistItem[]) => {
    let result = '';
    let itemIndex = 0;

    textParts.forEach(part => {
      if (part.startsWith('CHECKLIST_ITEM_')) {
        const item = items[itemIndex];
        if (item) {
          const checkbox = item.checked ? '[x]' : '[ ]';
          result += `- ${checkbox} ${item.text}\n`;
          itemIndex++;
        }
      } else {
        result += part + '\n';
      }
    });

    return result.trim();
  };

  const renderContent = () => {
    // Renderiza apenas o texto da descrição, SEM os símbolos de checkbox
    const cleanDescription = description.replace(/-\s*\[([xX\s])\]\s*(.+)/g, '').trim();
    
    if (!cleanDescription) return null;
    
    return (
      <div className="description-text">
        {cleanDescription.split('\n').map((line, index) => (
          line.trim() ? <p key={index}>{line}</p> : null
        ))}
      </div>
    );
  };

  const renderCheckboxes = () => {
    if (checklistItems.length === 0) return null;

    return (
      <div className="checklist-items">
        {checklistItems.map((item, index) => (
          <div key={`checklist-${index}`} className="checklist-item">
            <label 
              className="checklist-label"
              onClick={(e) => e.stopPropagation()} // Impede que o clique no label abra o modal
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) => {
                  e.stopPropagation(); // Impede que o clique abra o modal de edição
                  handleCheckboxChange(item.id, e.target.checked);
                }}
                className="checklist-checkbox"
              />
              <span className="checklist-checkmark"></span>
              <span className={`checklist-text ${item.checked ? 'checked' : ''}`}>
                {item.text}
              </span>
            </label>
          </div>
        ))}
      </div>
    );
  };

  const completedItems = checklistItems.filter(item => item.checked).length;
  const totalItems = checklistItems.length;
  const hasChecklist = totalItems > 0;

  return (
    <div className={`checklist-description ${className} ${isExpanded ? 'expanded' : ''}`}>
      {hasChecklist && (
        <div className="checklist-progress">
          <span className="progress-text">
            📋 {completedItems}/{totalItems} concluído{completedItems !== 1 ? 's' : ''}
          </span>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: totalItems > 0 ? `${(completedItems / totalItems) * 100}%` : '0%' }}
            ></div>
          </div>
        </div>
      )}
      
      <div className="description-content">
        {renderContent()}
        {renderCheckboxes()}
      </div>
    </div>
  );
};

export default ChecklistDescription;
