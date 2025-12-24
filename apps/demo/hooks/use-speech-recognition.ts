"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Type definitions for Web Speech API
interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const getSpeechRecognitionAPI = ():
  | SpeechRecognitionConstructor
  | undefined => {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
};

export type UseSpeechRecognitionOptions = {
  /**
   * The language for speech recognition (e.g., "en-US", "zh-CN").
   * Defaults to the browser's language.
   */
  language?: string;
  /**
   * Whether to continue listening after the user stops speaking.
   * Defaults to true.
   */
  continuous?: boolean;
  /**
   * Whether to return interim (partial) results.
   * Defaults to true for real-time feedback.
   */
  interimResults?: boolean;
  /**
   * Callback when final transcript is committed.
   */
  onResult?: (transcript: string) => void;
};

export type UseSpeechRecognitionReturn = {
  /** Whether the browser supports speech recognition */
  isSupported: boolean;
  /** Whether speech recognition is currently active */
  isListening: boolean;
  /** The current interim transcript (real-time preview) */
  interimTranscript: string;
  /** Start speech recognition */
  startListening: () => void;
  /** Stop speech recognition */
  stopListening: () => void;
};

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionReturn {
  const {
    language,
    continuous = true,
    interimResults = true,
    onResult,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onResultRef = useRef(onResult);

  // Keep callback ref updated
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  // Check browser support on mount
  useEffect(() => {
    setIsSupported(getSpeechRecognitionAPI() !== undefined);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = getSpeechRecognitionAPI();
    if (!SpeechRecognitionAPI) {
      console.error(
        "SpeechRecognition is not supported in this browser. Try using Chrome, Edge, or Safari.",
      );
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    // Configure recognition
    const defaultLanguage =
      typeof navigator !== "undefined" && navigator.language
        ? navigator.language
        : "en-US";
    recognition.lang = language ?? defaultLanguage;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    let finalTranscript = "";

    recognition.addEventListener("start", () => {
      setIsListening(true);
      setInterimTranscript("");
    });

    recognition.addEventListener("result", (event) => {
      const speechEvent = event as unknown as SpeechRecognitionEvent;
      let interim = "";

      for (
        let i = speechEvent.resultIndex;
        i < speechEvent.results.length;
        i++
      ) {
        const result = speechEvent.results[i];
        if (!result) continue;

        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscript += transcript;
          // Immediately call onResult for final results
          if (onResultRef.current && transcript.trim()) {
            onResultRef.current(transcript);
          }
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);
    });

    recognition.addEventListener("end", () => {
      setIsListening(false);
      setInterimTranscript("");
      recognitionRef.current = null;
    });

    recognition.addEventListener("error", (event) => {
      const errorEvent = event as unknown as SpeechRecognitionErrorEvent;
      // Don't log aborted errors as they're expected when stopping
      if (errorEvent.error !== "aborted") {
        console.error(
          "Speech recognition error:",
          errorEvent.error,
          errorEvent.message,
        );
      }
      setIsListening(false);
      setInterimTranscript("");
      recognitionRef.current = null;
    });

    try {
      recognition.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [language, continuous, interimResults]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    interimTranscript,
    startListening,
    stopListening,
  };
}
