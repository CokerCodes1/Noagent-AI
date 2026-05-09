import { useSyncExternalStore } from "react";
import { getStoredUser, subscribeToSessionChanges } from "../utils/session.js";

function getServerSnapshot() {
  return null;
}

export default function useCurrentUser() {
  return useSyncExternalStore(
    subscribeToSessionChanges,
    getStoredUser,
    getServerSnapshot
  );
}
