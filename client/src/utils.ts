import {useEffect, useState} from "react";
import api from "./api";

export interface AsyncAPIDataState<T> {
  loading: boolean;
  invalid: boolean;
  success?: boolean;
  error?: string;
  data?: T;
}

export const useAPIData = <T extends (...args: any[]) => Promise<any>>(
  fetchData: T,
  ...args: Parameters<T>
) => {
  const [state, setState] = useState<AsyncAPIDataState<Awaited<ReturnType<T>>>>({
    loading: false,
    invalid: true
  });

  const {loading, invalid} = state;

  useEffect(() => {
    if (!invalid || loading) {
      return;
    }

    setState({
      ...state,
      loading: true,
      success: undefined,
      error: undefined
    });

    const execute = async () => {
      try {
        const result = await fetchData.bind(api)(...args);
        setState({
          ...state,
          loading: false,
          success: true,
          invalid: false,
          data: result
        });
      } catch (error) {
        setState({
          ...state,
          loading: false,
          success: false,
          invalid: false,
          error
        });
      }
    };

    execute();
  }, [invalid, loading]);

  return {state, invalidate: () => setState({...state, invalid: true})};
};
