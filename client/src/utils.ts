import {useEffect, useState} from "react";
import api from "./api";

export interface AsyncAPIDataState<T> {
  loading: boolean;
  invalid: boolean;
  success?: boolean;
  error?: string;
  data?: T;
}
