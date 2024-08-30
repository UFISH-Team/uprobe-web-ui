import { create } from "zustand";

import {
  PanelLabel,
} from "./types";


interface IProps {
  panel: PanelLabel,
  setPanel: (p: PanelLabel) => void, 
  serverAddr: string,
  setServerAddr: (addr: string) => void,
}


const useStore = create<IProps>((set) => ({
  panel: "home",
  setPanel: (p) => { set({panel: p}) },
  serverAddr: "http://127.0.0.1:5000",
  setServerAddr: (addr) => { set({ serverAddr: addr }) },
}))


export default useStore
