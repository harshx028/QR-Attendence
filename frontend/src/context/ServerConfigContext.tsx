import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

interface ServerConfigContextType {
  serverUrl: string | null;
  isConfigured: boolean;
  isLoading: boolean;
  setServerUrl: (url: string) => Promise<void>;
  clearServerUrl: () => Promise<void>;
}

const ServerConfigContext = createContext<ServerConfigContextType | undefined>(undefined);

const SERVER_URL_KEY = "server_url";

export const ServerConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [serverUrl, setServerUrlState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadServerUrl();
  }, []);

  const loadServerUrl = async () => {
    try {
      const savedUrl = await SecureStore.getItemAsync(SERVER_URL_KEY);
      if (savedUrl) {
        setServerUrlState(savedUrl);
      }
    } catch (error) {
      console.error("Error loading server URL:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setServerUrl = async (url: string) => {
    try {
      // Normalize URL - remove trailing slash
      let normalizedUrl = url.trim();
      if (normalizedUrl.endsWith("/")) {
        normalizedUrl = normalizedUrl.slice(0, -1);
      }
      await SecureStore.setItemAsync(SERVER_URL_KEY, normalizedUrl);
      setServerUrlState(normalizedUrl);
    } catch (error) {
      console.error("Error saving server URL:", error);
      throw error;
    }
  };

  const clearServerUrl = async () => {
    try {
      await SecureStore.deleteItemAsync(SERVER_URL_KEY);
      setServerUrlState(null);
    } catch (error) {
      console.error("Error clearing server URL:", error);
      throw error;
    }
  };

  return (
    <ServerConfigContext.Provider
      value={{
        serverUrl,
        isConfigured: !!serverUrl,
        isLoading,
        setServerUrl,
        clearServerUrl,
      }}
    >
      {children}
    </ServerConfigContext.Provider>
  );
};

export const useServerConfig = () => {
  const context = useContext(ServerConfigContext);
  if (context === undefined) {
    throw new Error("useServerConfig must be used within a ServerConfigProvider");
  }
  return context;
};

export default useServerConfig;
