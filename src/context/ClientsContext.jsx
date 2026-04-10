import { createContext, useState, useContext } from "react";

const ClientsContext = createContext(null);

export function ClientsProvider({ children }) {
  const [clients, setClients] = useState([]);

  const addClient = (clientName) => setClients((prev) => [...prev, clientName]);

  return (
    <ClientsContext.Provider value={{ clients, addClient }}>
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  return useContext(ClientsContext);
}
