import React, { useState, useRef, useEffect } from 'react';

export interface DropdownOption {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  sublabel?: string;
  badge?: string;
}

export interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  searchable?: boolean;
  label?: string;
  align?: 'left' | 'right';
  direction?: 'down' | 'up' | 'auto';
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  className = '',
  id,
  searchable = true,
  label,
  align = 'left',
  direction = 'auto',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.id === value);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search on open and calculate upward/downward direction
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      if (direction === 'up') {
        setOpenUpward(true);
      } else if (direction === 'down') {
        setOpenUpward(false);
      } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpward(spaceBelow < 260 && rect.top > 260);
      }

      if (searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 60);
      }
    }
  }, [isOpen, direction, searchable]);

  const filteredOptions = options.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div
      ref={containerRef}
      id={id ? `${id}-container` : undefined}
      className={`relative ${isOpen ? 'z-50' : 'z-10'} ${className}`}
    >
      {label && (
        <label className="font-body text-[11px] font-bold text-[#888888] block mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 bg-[#121212] hover:bg-[#171717] text-[#E0E0E0] border transition-all rounded-xl py-2.5 px-3 min-h-[46px] text-left cursor-pointer outline-none ${
          isOpen
            ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/30 shadow-md'
            : 'border-[#262626] hover:border-[#383838]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: selectedOption.color ? `${selectedOption.color}25` : '#D4AF3720',
                    color: selectedOption.color || '#D4AF37',
                  }}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {selectedOption.icon}
                  </span>
                </div>
              )}
              {!selectedOption.icon && selectedOption.color && (
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: selectedOption.color }}
                />
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-body text-[13px] font-semibold text-[#FFFFFF] truncate leading-tight">
                  {selectedOption.label}
                </span>
                {selectedOption.sublabel && (
                  <span className="font-body text-[10px] text-[#777777] truncate leading-tight">
                    {selectedOption.sublabel}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span className="font-body text-[13px] text-[#777777]">{placeholder}</span>
          )}
        </div>

        <span
          className={`material-symbols-outlined text-[#888888] text-[20px] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#D4AF37]' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {/* Floating Menu */}
      {isOpen && (
        <div
          className={`absolute z-[9999] w-full min-w-[220px] max-w-sm bg-[#1A1A1A] border border-[#333333] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.95)] p-2 backdrop-blur-xl animate-fadeIn flex flex-col gap-1.5 ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {/* Quick Search */}
          {searchable && options.length > 5 && (
            <div className="flex items-center gap-2 bg-[#222222] border border-[#303030] rounded-xl px-2.5 py-1.5 focus-within:border-[#D4AF37] transition-colors">
              <span className="material-symbols-outlined text-[16px] text-[#777777]">
                search
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="bg-transparent font-body text-[12px] text-[#FFFFFF] placeholder-[#666666] outline-none w-full"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-[#777777] hover:text-[#FFFFFF]"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto pr-1 flex flex-col gap-1 overscroll-contain">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-[#777777] text-[12px] font-body">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#D4AF37]/15 text-[#FFFFFF] border border-[#D4AF37]/40'
                        : 'text-[#C0C0C0] hover:bg-[#262626] hover:text-[#FFFFFF] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {opt.icon && (
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                          style={{
                            backgroundColor: opt.color ? `${opt.color}25` : '#333333',
                            color: opt.color || '#D4AF37',
                          }}
                        >
                          <span className="material-symbols-outlined text-[17px]">
                            {opt.icon}
                          </span>
                        </div>
                      )}
                      {!opt.icon && opt.color && (
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: opt.color }}
                        />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-body text-[13px] font-semibold truncate leading-tight">
                          {opt.label}
                        </span>
                        {opt.sublabel && (
                          <span className="font-body text-[10px] text-[#777777] uppercase tracking-wider leading-tight">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <span className="material-symbols-outlined text-[18px] text-[#D4AF37] shrink-0">
                        check
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
