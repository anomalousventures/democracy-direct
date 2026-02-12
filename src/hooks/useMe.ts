import { useStore } from "@nanostores/preact";
import { $user, $isLoading, fetchUser, clearUser } from "@/stores/user";

export function useMe() {
  const user = useStore($user);
  const isLoading = useStore($isLoading);

  return {
    user,
    isLoading,
    isLoggedIn: !!user,
    refetch: fetchUser,
    clear: clearUser,
  };
}
