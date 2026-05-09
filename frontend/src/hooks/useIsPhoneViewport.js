import { useEffect, useState } from "react";

const PHONE_MEDIA_QUERY = "(max-width: 768px)";

export default function useIsPhoneViewport() {
  const [isPhoneViewport, setIsPhoneViewport] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia(PHONE_MEDIA_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(PHONE_MEDIA_QUERY);

    function handleChange(event) {
      setIsPhoneViewport(event.matches);
    }

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return isPhoneViewport;
}
