import { useState, useRef, useEffect } from "react";
import { fetchCitiesByState } from "../services/IBGE_services";

interface CityAutocompleteProps {
  stateUf: string;
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CityAutocomplete({ stateUf, value, onChange, placeholder = "Buscar cidade...", disabled, className = "" }: CityAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

// Novos states para gerenciar a API do IBGE
  const [cities, setCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Busca as cidades quando o estado (stateUf) mudar
  useEffect(() => {
    async function loadCities() {
      if (!stateUf) {
        setCities([]);
        return;
      }
      
      setIsLoading(true);
      const fetchedCities = await fetchCitiesByState(stateUf);
      setCities(fetchedCities);
      setIsLoading(false);
    }

    loadCities();
  }, [stateUf]);

  // Sua lógica de filtro mantida (agora tipando o 'c' como string para o TS não reclamar)
  const filtered = query
    ? cities.filter((c: string) => c.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
    : cities.slice(0, 10);
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (city: string) => {
    setQuery(city);
    onChange(city);
    setIsOpen(false);
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    setIsOpen(true);
    if (!val) {
      onChange("");
    }
  };

  return (


    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={isLoading ? "Carregando cidades..." : placeholder}
        disabled={disabled || !stateUf || isLoading}
        className={`w-full bg-input-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] disabled:opacity-40 ${className}`}
        style={{ fontSize: "13px" }}
      />
      {isOpen && filtered.length > 0 && stateUf && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-[200px] overflow-auto">
          {filtered.map(city => (
            <button
              key={city}
              onClick={() => handleSelect(city)}
              className={`w-full text-left px-3 py-2 hover:bg-secondary transition-colors ${value === city ? "bg-[#6366f1]/10 text-[#6366f1]" : "text-foreground"}`}
              style={{ fontSize: "13px" }}
            >
              {city}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-muted-foreground" style={{ fontSize: "12px" }}>
              Nenhuma cidade encontrada
            </div>
          )}
        </div>
      )}
    </div>
  );
}
