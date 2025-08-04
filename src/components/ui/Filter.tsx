import { useState, useEffect, useRef } from 'react';
import { XIcon, ChevronDownIcon, CheckIcon } from 'lucide-react';
import { AgentData } from '@/types/AgentData';

interface FilterProps {
  agentData: AgentData[];
  onFilterChange: (filters: FilterState) => void;
  isVisible: boolean;
  onClose: () => void;
}

export interface FilterState {
  stateLocation: string[];
  division: string[];
  department: string[];
  managerName: string[];
}

const Filter = ({ agentData, onFilterChange, isVisible, onClose }: FilterProps) => {
  const [filters, setFilters] = useState<FilterState>({
    stateLocation: [],
    division: [],
    department: [],
    managerName: []
  });

  // unique vals
  const getUniqueValues = (field: keyof AgentData): string[] => {
    const values = agentData
      .map(agent => agent[field])
      .filter(value => value && value.toString().trim() !== '')
      .map(value => value!.toString().trim());
    
    return [...new Set(values)].sort();
  };

  const uniqueStates = getUniqueValues('State/Location');
  const uniqueDivisions = getUniqueValues('Division');
  const uniqueDepartments = getUniqueValues('Department');
  const uniqueManagers = getUniqueValues('Manager Name');

  const handleClearAll = () => {
    const emptyFilters = {
      stateLocation: [],
      division: [],
      department: [],
      managerName: []
    };
    setFilters(emptyFilters);
  };

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

//   filter count
  const getActiveFilterCount = () => {
    return filters.stateLocation.length + 
           filters.division.length + 
           filters.department.length + 
           filters.managerName.length;
  };

  if (!isVisible) return null;

  return (
    <div className="absolute top-16 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-80 z-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
          {getActiveFilterCount() > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full h-6 w-6">
              {getActiveFilterCount()}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {getActiveFilterCount() > 0 && (
        <div className="mb-4">
          <button
            onClick={handleClearAll}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Clear All Filters
          </button>
        </div>
      )}

      <div className="space-y-3">
        <MultiSelectDropdown
          label="State/Location"
          options={uniqueStates}
          selectedValues={filters.stateLocation}
          onSelectionChange={(values) => setFilters(prev => ({ ...prev, stateLocation: values }))}
        />

        <MultiSelectDropdown
          label="Division"
          options={uniqueDivisions}
          selectedValues={filters.division}
          onSelectionChange={(values) => setFilters(prev => ({ ...prev, division: values }))}
        />

        <MultiSelectDropdown
          label="Department"
          options={uniqueDepartments}
          selectedValues={filters.department}
          onSelectionChange={(values) => setFilters(prev => ({ ...prev, department: values }))}
        />

        <MultiSelectDropdown
          label="Manager"
          options={uniqueManagers}
          selectedValues={filters.managerName}
          onSelectionChange={(values) => setFilters(prev => ({ ...prev, managerName: values }))}
        />
      </div>
    </div>
  );
};

interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
}

const MultiSelectDropdown = ({ 
  label, 
  options, 
  selectedValues, 
  onSelectionChange 
}: MultiSelectDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOption = (option: string) => {
    const isSelected = selectedValues.includes(option);
    if (isSelected) {
      onSelectionChange(selectedValues.filter(value => value !== option));
    } else {
      onSelectionChange([...selectedValues, option]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(options);
  };

  const handleSelectNone = () => {
    onSelectionChange([]);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return `Select ${label}`;
    }
    if (selectedValues.length === 1) {
      return selectedValues[0];
    }
    if (selectedValues.length <= 2) {
      return selectedValues.join(', ');
    }
    return `${selectedValues.length} selected`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className={`truncate ${selectedValues.length === 0 ? 'text-gray-500' : 'text-gray-900'}`}>
            {getDisplayText()}
          </span>
          <ChevronDownIcon 
            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
          />
        </div>
      </button>

      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selectedValues.slice(0, 3).map(value => (
            <span
              key={value}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
            >
              {value.length > 15 ? `${value.substring(0, 15)}...` : value}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleOption(value);
                }}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
          {selectedValues.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
              +{selectedValues.length - 3} more
            </span>
          )}
        </div>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between text-xs">
              <button
                onClick={handleSelectAll}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Select All
              </button>
              <button
                onClick={handleSelectNone}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Select None
              </button>
            </div>
          </div>
{/* options map */}
          <div className="py-1">
            {options.map(option => {
              const isSelected = selectedValues.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => handleToggleOption(option)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between group"
                >
                  <span className={`truncate ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                    {option}
                  </span>
                  {isSelected && (
                    <CheckIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Filter;