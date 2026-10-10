import { createContext, useContext, useState, type ReactNode } from 'react';
const Context = createContext({ hidden: false, setHidden: (_: boolean) => {} });
export function NavChromeProvider({ children }: { children: ReactNode }) { const [hidden, setHidden] = useState(false); return <Context.Provider value={{ hidden, setHidden }}>{children}</Context.Provider>; }
export function useNavChrome() { return useContext(Context); }
