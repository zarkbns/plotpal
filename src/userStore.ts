import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile, UserManuscriptMeta } from "./types";

/**
 * Fetch minimal user profile and manuscript titles/IDs index from Firestore.
 * Note: Does NOT store or retrieve any manuscript text, continuity violations, or analysis data.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, "users", userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: userId,
        name: data.name || "Story Author",
        email: data.email || "",
        picture: data.picture || "",
        role: data.role || "Narrative Architect",
        isAuthenticated: true,
        manuscripts: data.manuscripts || [],
      };
    }
    return null;
  } catch (error) {
    console.warn("[Firestore] Failed to get user profile:", error);
    return null;
  }
}

/**
 * Sync minimal user profile info to Firestore on Google Sign-In.
 */
export async function syncUserProfile(
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> {
  try {
    const userDocRef = doc(db, "users", userId);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      await setDoc(userDocRef, {
        name: profile.name || "Story Author",
        email: profile.email || "",
        picture: profile.picture || "",
        role: profile.role || "Narrative Architect",
        createdAt: new Date().toISOString(),
        manuscripts: profile.manuscripts || [],
      });
    } else {
      await updateDoc(userDocRef, {
        name: profile.name || snap.data()?.name || "Story Author",
        email: profile.email || snap.data()?.email || "",
        picture: profile.picture || snap.data()?.picture || "",
        lastLoginAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.warn("[Firestore] Failed to sync user profile:", error);
  }
}

/**
 * Add or update a manuscript's minimal title/ID in the user's Firestore list.
 * Only stores: id, title, genre, inUniverseTime.
 * NEVER stores manuscript text or continuity analysis.
 */
export async function saveUserManuscriptMeta(
  userId: string,
  meta: UserManuscriptMeta
): Promise<void> {
  try {
    const userDocRef = doc(db, "users", userId);
    const snap = await getDoc(userDocRef);
    let existingList: UserManuscriptMeta[] = [];
    if (snap.exists()) {
      existingList = snap.data()?.manuscripts || [];
    }

    const filtered = existingList.filter((m) => m.id !== meta.id);
    const updated = [meta, ...filtered];

    await setDoc(
      userDocRef,
      {
        manuscripts: updated,
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("[Firestore] Failed to save manuscript metadata:", error);
  }
}
