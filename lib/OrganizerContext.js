"use client";
import { createContext, useContext } from "react";

const OrganizerContext = createContext(null);

export function useOrganizerProfile() {
  return useContext(OrganizerContext);
}

export default OrganizerContext;
