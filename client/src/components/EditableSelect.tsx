import React, { useState, useMemo } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface EditableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  inputPlaceholder?: string;
  searchPlaceholder?: string;
  className?: string;
  inputClassName?: string;
  onOptionsChange?: (options: string[]) => void;
  emptyText?: string;
  addText?: (value: string) => string;
}

export const EditableSelect: React.FC<EditableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = '请输入或选择...',
  inputPlaceholder,
  searchPlaceholder = '搜索或输入新值...',
  className,
  inputClassName,
  onOptionsChange,
  emptyText = '无匹配选项',
  addText = (v) => `使用 "${v}"`,
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // 去重并排序的选项
  const uniqueOptions = useMemo(() => {
    const set = new Set(options.filter(Boolean));
    return Array.from(set).sort();
  }, [options]);

  // 过滤后的选项
  const filteredOptions = useMemo(() => {
    if (!inputValue.trim()) return uniqueOptions;
    return uniqueOptions.filter((opt) =>
      opt.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [uniqueOptions, inputValue]);

  // 是否显示"添加新值"选项
  const showAddOption = useMemo(() => {
    if (!inputValue.trim()) return false;
    return !uniqueOptions.some(
      (opt) => opt.toLowerCase() === inputValue.trim().toLowerCase()
    );
  }, [uniqueOptions, inputValue]);

  // 处理输入框变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  // 处理选择选项
  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    onChange(selectedValue);
    setOpen(false);
  };

  // 处理添加新值
  const handleAddNew = () => {
    const newValue = inputValue.trim();
    if (newValue && onOptionsChange) {
      const newOptions = [...options, newValue];
      onOptionsChange(newOptions);
    }
    onChange(newValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn('relative flex items-center', className)}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={inputPlaceholder || placeholder}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-8',
            inputClassName
          )}
        />
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className="absolute right-1 h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors"
            onClick={(e) => {
              e.preventDefault();
              setOpen(!open);
            }}
          >
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={(val) => {
              setInputValue(val);
              onChange(val);
            }}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => handleSelect(option)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      inputValue === option ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
              {showAddOption && (
                <CommandItem
                  value={`__add__${inputValue}`}
                  onSelect={handleAddNew}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {addText(inputValue)}
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default EditableSelect;
