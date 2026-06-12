import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

const FONT_SIZE_KEY = "app_font_size";
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 24;
const INITIAL_FONT_SIZE = 16;
const FONT_SIZE_STEP = 2;

interface FontSizeContextType {
  fontSize: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(
  undefined
);

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState(INITIAL_FONT_SIZE);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar tamanho de fonte do AsyncStorage ao inicializar
  useEffect(() => {
    const loadFontSize = async () => {
      try {
        const savedFontSize = await AsyncStorage.getItem(FONT_SIZE_KEY);
        if (savedFontSize) {
          const parsedSize = parseInt(savedFontSize, 10);
          if (!isNaN(parsedSize)) {
            setFontSize(parsedSize);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar tamanho de fonte:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFontSize();
  }, []);

  // Salvar tamanho de fonte no AsyncStorage sempre que mudar
  const saveFontSize = async (newSize: number) => {
    try {
      await AsyncStorage.setItem(FONT_SIZE_KEY, newSize.toString());
    } catch (error) {
      console.error("Erro ao salvar tamanho de fonte:", error);
    }
  };

  const increaseFontSize = () => {
    setFontSize((prevSize) => {
      const newSize = Math.min(prevSize + FONT_SIZE_STEP, MAX_FONT_SIZE);
      saveFontSize(newSize);
      return newSize;
    });
  };

  const decreaseFontSize = () => {
    setFontSize((prevSize) => {
      const newSize = Math.max(prevSize - FONT_SIZE_STEP, MIN_FONT_SIZE);
      saveFontSize(newSize);
      return newSize;
    });
  };

  const resetFontSize = () => {
    saveFontSize(INITIAL_FONT_SIZE);
    setFontSize(INITIAL_FONT_SIZE);
  };

  if (isLoading) {
    return null; // Ou um splash screen se preferir
  }

  return (
    <FontSizeContext.Provider
      value={{
        fontSize,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
      }}
    >
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (!context) {
    throw new Error("useFontSize deve ser usado dentro de FontSizeProvider");
  }
  return context;
}