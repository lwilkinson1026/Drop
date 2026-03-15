import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { DROP_LOCATIONS, DropLocation } from "@/constants/dropLocations";

export type UserRole = "maker" | "buyer";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  creditBalance: number;
  avatar?: string;
  city?: string;
  state?: string;
  makerBio?: string;
  makerPhotoUri?: string;
  defaultDropLocationId?: string;
  location?: { lat: number; lng: number };
}

export interface Review {
  id: string;
  listingId: string;
  listingTitle: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  revieweeName: string;
  rating: number;
  comment: string;
  timestamp: number;
  type: "buyer-reviews-maker" | "maker-reviews-buyer";
}

export interface ListingItem {
  id: string;
  makerId: string;
  makerName: string;
  title: string;
  description: string;
  photoUri: string | null;
  dropOffPhotoUri?: string | null;
  dropOffTimestamp?: number;
  pickupTimestamp?: number;
  pickupBuyerId?: string;
  pickupBuyerName?: string;
  boxLocation: {
    lat: number;
    lng: number;
    address: string;
    dropLocationId?: string;
  };
  quantity: number;
  unit: string;
  creditCost: number;
  priceCents?: number;
  timestamp: number;
  available: boolean;
  category: "vegetables" | "fruits" | "herbs" | "eggs" | "dairy" | "other";
}

export interface Transaction {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerId: string;
  makerId: string;
  credits: number;
  timestamp: number;
  type: "purchase" | "sale";
}

export interface ManagedDropLocation extends DropLocation {
  builtIn?: boolean;
}

interface AppContextValue {
  user: User | null;
  listings: ListingItem[];
  transactions: Transaction[];
  reviews: Review[];
  dropLocations: ManagedDropLocation[];
  suspendedUserIds: string[];
  isLoading: boolean;
  setUser: (u: User | null) => void;
  addListing: (l: Omit<ListingItem, "id" | "timestamp">) => Promise<void>;
  removeListing: (id: string) => Promise<void>;
  claimListing: (listing: ListingItem) => Promise<boolean>;
  refreshListings: () => Promise<void>;
  addDropLocation: (loc: Omit<DropLocation, "id">) => Promise<void>;
  removeDropLocation: (id: string) => Promise<void>;
  addReview: (review: Omit<Review, "id" | "timestamp">) => Promise<void>;
  getReviewsForUser: (userId: string) => Review[];
  getUserRating: (userId: string) => { average: number; count: number };
  hasReviewed: (listingId: string, reviewerId: string, type: Review["type"]) => boolean;
  toggleSuspendUser: (userId: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEYS = {
  user: "drop_user",
  listings: "drop_listings",
  transactions: "drop_transactions",
  customLocations: "drop_custom_locations",
  reviews: "drop_reviews",
  suspendedUsers: "drop_suspended_users",
};

const LYNCH_LANE = {
  lat: 46.6021,
  lng: -120.5059,
  address: "791 Lynch Lane, Yakima WA",
  dropLocationId: "lynch-lane-yakima",
};

const BUILT_IN_LOCATIONS: ManagedDropLocation[] = DROP_LOCATIONS.map((l) => ({
  ...l,
  builtIn: true,
}));

const DEMO_LISTINGS: ListingItem[] = [
  {
    id: "demo1",
    makerId: "maker1",
    makerName: "Rose Valley Farm",
    title: "Fresh Heirloom Tomatoes",
    description: "Sun-ripened Cherokee Purple and Brandywine tomatoes. Picked this morning.",
    photoUri: null,
    dropOffTimestamp: Date.now() - 3600000,
    boxLocation: { ...LYNCH_LANE },
    quantity: 8,
    unit: "lbs",
    creditCost: 4,
    timestamp: Date.now() - 3600000,
    available: true,
    category: "vegetables",
  },
  {
    id: "demo2",
    makerId: "maker2",
    makerName: "Honeybee Hollow",
    title: "Duck Eggs (dozen)",
    description: "Free-range Khaki Campbell duck eggs. Rich golden yolks.",
    photoUri: null,
    dropOffTimestamp: Date.now() - 7200000,
    boxLocation: { ...LYNCH_LANE },
    quantity: 2,
    unit: "dozen",
    creditCost: 6,
    timestamp: Date.now() - 7200000,
    available: true,
    category: "eggs",
  },
  {
    id: "demo3",
    makerId: "maker3",
    makerName: "Green Thumb Gardens",
    title: "Fresh Basil Bunches",
    description: "Sweet Genovese basil, just cut. Perfect for pesto.",
    photoUri: null,
    dropOffTimestamp: Date.now() - 1800000,
    boxLocation: { ...LYNCH_LANE },
    quantity: 12,
    unit: "bunches",
    creditCost: 2,
    timestamp: Date.now() - 1800000,
    available: true,
    category: "herbs",
  },
  {
    id: "demo4",
    makerId: "maker4",
    makerName: "Clearwater Orchard",
    title: "Seckel Pears",
    description: "Small but intensely sweet. Great for snacking or preserves.",
    photoUri: null,
    dropOffTimestamp: Date.now() - 5400000,
    boxLocation: { ...LYNCH_LANE },
    quantity: 5,
    unit: "lbs",
    creditCost: 3,
    timestamp: Date.now() - 5400000,
    available: true,
    category: "fruits",
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customLocations, setCustomLocations] = useState<ManagedDropLocation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [suspendedUserIds, setSuspendedUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rawUser, rawListings, rawTx, rawLocs, rawReviews, rawSuspended] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.user),
        AsyncStorage.getItem(STORAGE_KEYS.listings),
        AsyncStorage.getItem(STORAGE_KEYS.transactions),
        AsyncStorage.getItem(STORAGE_KEYS.customLocations),
        AsyncStorage.getItem(STORAGE_KEYS.reviews),
        AsyncStorage.getItem(STORAGE_KEYS.suspendedUsers),
      ]);
      if (rawUser) setUserState(JSON.parse(rawUser));
      const stored = rawListings ? JSON.parse(rawListings) : [];
      const merged = [
        ...DEMO_LISTINGS,
        ...stored.filter((s: ListingItem) => !DEMO_LISTINGS.find((d) => d.id === s.id)),
      ];
      setListings(merged);
      if (rawTx) setTransactions(JSON.parse(rawTx));
      if (rawLocs) setCustomLocations(JSON.parse(rawLocs));
      if (rawReviews) setReviews(JSON.parse(rawReviews));
      if (rawSuspended) setSuspendedUserIds(JSON.parse(rawSuspended));
    } catch {
      setListings(DEMO_LISTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  const dropLocations: ManagedDropLocation[] = useMemo(
    () => [...BUILT_IN_LOCATIONS, ...customLocations],
    [customLocations]
  );

  const setUser = useCallback(async (u: User | null) => {
    setUserState(u);
    if (u) await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(u));
    else await AsyncStorage.removeItem(STORAGE_KEYS.user);
  }, []);

  const addListing = useCallback(
    async (l: Omit<ListingItem, "id" | "timestamp">) => {
      const newItem: ListingItem = {
        ...l,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        dropOffTimestamp: l.dropOffTimestamp ?? Date.now(),
      };
      const updated = [newItem, ...listings.filter((x) => !DEMO_LISTINGS.find((d) => d.id === x.id))];
      setListings((prev) => [newItem, ...prev]);
      await AsyncStorage.setItem(STORAGE_KEYS.listings, JSON.stringify(updated));
    },
    [listings]
  );

  const removeListing = useCallback(
    async (id: string) => {
      const updated = listings.filter((l) => l.id !== id);
      setListings(updated);
      const stored = updated.filter((x) => !DEMO_LISTINGS.find((d) => d.id === x.id));
      await AsyncStorage.setItem(STORAGE_KEYS.listings, JSON.stringify(stored));
    },
    [listings]
  );

  const claimListing = useCallback(
    async (listing: ListingItem): Promise<boolean> => {
      if (!user) return false;
      if (user.creditBalance < listing.creditCost) return false;

      const pickupTimestamp = Date.now();

      const tx: Transaction = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        listingId: listing.id,
        listingTitle: listing.title,
        buyerId: user.id,
        makerId: listing.makerId,
        credits: listing.creditCost,
        timestamp: pickupTimestamp,
        type: "purchase",
      };

      const updatedUser: User = {
        ...user,
        creditBalance: user.creditBalance - listing.creditCost,
      };

      const updatedListings = listings.map((l) =>
        l.id === listing.id
          ? {
              ...l,
              quantity: l.quantity - 1,
              available: l.quantity - 1 > 0,
              pickupTimestamp,
              pickupBuyerId: user.id,
              pickupBuyerName: user.name,
            }
          : l
      );

      const newTxs = [tx, ...transactions];
      setUserState(updatedUser);
      setListings(updatedListings);
      setTransactions(newTxs);

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser)),
        AsyncStorage.setItem(
          STORAGE_KEYS.listings,
          JSON.stringify(updatedListings.filter((x) => !DEMO_LISTINGS.find((d) => d.id === x.id)))
        ),
        AsyncStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(newTxs)),
      ]);

      console.log("door open");
      return true;
    },
    [user, listings, transactions]
  );

  const refreshListings = useCallback(async () => {
    await loadData();
  }, []);

  const addDropLocation = useCallback(
    async (loc: Omit<DropLocation, "id">) => {
      const newLoc: ManagedDropLocation = {
        ...loc,
        id: "loc_" + Date.now().toString() + Math.random().toString(36).substr(2, 6),
        builtIn: false,
      };
      const updated = [...customLocations, newLoc];
      setCustomLocations(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.customLocations, JSON.stringify(updated));
    },
    [customLocations]
  );

  const removeDropLocation = useCallback(
    async (id: string) => {
      const updated = customLocations.filter((l) => l.id !== id);
      setCustomLocations(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.customLocations, JSON.stringify(updated));
    },
    [customLocations]
  );

  const addReview = useCallback(
    async (review: Omit<Review, "id" | "timestamp">) => {
      const newReview: Review = {
        ...review,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
      };
      const updated = [newReview, ...reviews];
      setReviews(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(updated));
    },
    [reviews]
  );

  const getReviewsForUser = useCallback(
    (userId: string) => reviews.filter((r) => r.revieweeId === userId),
    [reviews]
  );

  const getUserRating = useCallback(
    (userId: string): { average: number; count: number } => {
      const userReviews = reviews.filter((r) => r.revieweeId === userId);
      if (userReviews.length === 0) return { average: 0, count: 0 };
      const sum = userReviews.reduce((acc, r) => acc + r.rating, 0);
      return { average: sum / userReviews.length, count: userReviews.length };
    },
    [reviews]
  );

  const hasReviewed = useCallback(
    (listingId: string, reviewerId: string, type: Review["type"]) =>
      reviews.some((r) => r.listingId === listingId && r.reviewerId === reviewerId && r.type === type),
    [reviews]
  );

  const toggleSuspendUser = useCallback(
    async (userId: string) => {
      const updated = suspendedUserIds.includes(userId)
        ? suspendedUserIds.filter((id) => id !== userId)
        : [...suspendedUserIds, userId];
      setSuspendedUserIds(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.suspendedUsers, JSON.stringify(updated));
    },
    [suspendedUserIds]
  );

  const value = useMemo(
    () => ({
      user,
      listings,
      transactions,
      reviews,
      dropLocations,
      suspendedUserIds,
      isLoading,
      setUser,
      addListing,
      removeListing,
      claimListing,
      refreshListings,
      addDropLocation,
      removeDropLocation,
      addReview,
      getReviewsForUser,
      getUserRating,
      hasReviewed,
      toggleSuspendUser,
    }),
    [user, listings, transactions, reviews, dropLocations, suspendedUserIds, isLoading, setUser, addListing, removeListing, claimListing, refreshListings, addDropLocation, removeDropLocation, addReview, getReviewsForUser, getUserRating, hasReviewed, toggleSuspendUser]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
