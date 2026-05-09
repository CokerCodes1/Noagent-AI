import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import api, { extractErrorMessage } from "../api/axios.js";

const TestimonialsContext = createContext(null);

export function useTestimonials() {
  const context = useContext(TestimonialsContext);

  if (!context) {
    throw new Error(
      "useTestimonials must be used within a TestimonialsProvider",
    );
  }

  return context;
}

export default function TestimonialsProvider({ children }) {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isMountedRef = useRef(true);

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/testimonials?limit=24");
      const fetchedTestimonials = Array.isArray(response.data.testimonials)
        ? response.data.testimonials
        : [];

      if (!isMountedRef.current) {
        return;
      }

      const sortedTestimonials = [...fetchedTestimonials].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setTestimonials(sortedTestimonials);
      setError("");
    } catch (requestError) {
      if (!isMountedRef.current) {
        return;
      }

      setTestimonials([]);
      setError(extractErrorMessage(requestError));
    } finally {
      if (!isMountedRef.current) {
        return;
      }

      setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchTestimonials();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchTestimonials]);

  const refreshTestimonials = useCallback(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  return (
    <TestimonialsContext.Provider
      value={{
        testimonials,
        loading,
        error,
        refreshTestimonials,
      }}
    >
      {children}
    </TestimonialsContext.Provider>
  );
}
