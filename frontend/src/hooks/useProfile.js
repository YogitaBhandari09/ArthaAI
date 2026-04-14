import { useCallback, useMemo, useState } from "react";

const STORAGE_KEY = "artha_ai_profile_v1";

const DEFAULT_PROFILE = {
  name: "",
  age: 0,
  income: 0,
  savings: 0,
  goal: "",
  risk: "low",
};

function readStoredProfile() {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function useProfile() {
  const [profile, setProfile] = useState(readStoredProfile);

  const save = useCallback((next) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    setProfile(next);
  }, []);

  const updateProfile = useCallback(
    (updates) => {
      setProfile((prev) => {
        const next = { ...prev, ...updates };
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });
    },
    []
  );

  const reset = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    save(DEFAULT_PROFILE);
  }, [save]);

  const isComplete = useMemo(() => {
    return Boolean(
      profile.name &&
        Number(profile.age) > 0 &&
        Number(profile.income) > 0 &&
        profile.goal &&
        profile.risk
    );
  }, [profile]);

  return { profile, updateProfile, isComplete, reset };
}

export default useProfile;
