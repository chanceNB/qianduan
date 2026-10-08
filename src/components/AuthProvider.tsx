import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { ApiError } from "../api/client";
import { authApi } from "../api/auth";
import { tokenStore } from "../api/runtime";
import type { User, Bootstrap } from "../contracts";
type Auth = {
  user: User | null;
  bootstrap: Bootstrap | null;
  loading: boolean;
  error: unknown;
  login: (
    username: string,
    password: string,
    remember: boolean,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  async function refresh() {
    const generation = tokenStore.generation();
    const me = await authApi.me();
    const config = await authApi.bootstrap();
    if (generation !== tokenStore.generation()) return;
    setUser(me);
    setBootstrap(config);
  }
  useEffect(() => {
    let active = true;
    const generation = tokenStore.generation();
    if (tokenStore.get())
      Promise.all([authApi.me(), authApi.bootstrap()])
        .then(
          ([me, config]) => {
            if (active && generation === tokenStore.generation()) {
              setUser(me);
              setBootstrap(config);
            }
          },
          (e) => {
            if (
              active &&
              generation === tokenStore.generation() &&
              !(e instanceof ApiError && e.code === "UNAUTHENTICATED")
            )
              setError(e);
          },
        )
        .finally(() => {
          if (active) setLoading(false);
        });
    else setLoading(false);
    const invalid = () => {
      setUser(null);
      setBootstrap(null);
      setError(null);
    };
    window.addEventListener("zhicha-unauthorized", invalid);
    return () => {
      active = false;
      window.removeEventListener("zhicha-unauthorized", invalid);
    };
  }, []);
  async function login(username: string, password: string, remember: boolean) {
    const result = await authApi.login({ username, password });
    tokenStore.set(result.access_token, remember);
    try {
      await refresh();
      setError(null);
    } catch (e) {
      tokenStore.clear();
      throw e;
    }
  }
  async function logout() {
    await authApi.logout();
    tokenStore.clear();
    setUser(null);
    setBootstrap(null);
  }
  return (
    <Context.Provider
      value={{ user, bootstrap, loading, error, login, logout, refresh }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider required");
  return value;
}
