import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type UserRole = "maker" | "buyer";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  creditBalance: number;
  avatar?: string;
  location?: { lat: number; lng: number };
}

export interface ListingItem {
  id: string;
  makerId: string;
  makerName: string;
  title: string;
  description: string;
  photoUri: string | null;
  boxLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  quantity: number;
  unit: string;
  creditCost: number;
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

interface AppContextValue {
  user: User | null;
  listings: ListingItem[];
  transactions: Transaction[];
  isLoading: boolean;
  setUser: (u: User | null) => void;
  addListing: (l: Omit<ListingItem, "id" | "timestamp">) => Promise<void>;
  removeListing: (id: string) => Promise<void>;
  claimListing: (listing: ListingItem) => Promise<boolean>;
  refreshListings: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEYS = {
  user: "harvestswap_user",
  listings: "harvestswap_listings",
  transactions: "harvestswap_transactions",
};

const DEMO_LISTINGS: ListingItem[] = [
  {
    id: "demo1",
    makerId: "maker1",
    makerName: "Rose Valley Farm",
    title: "Fresh Heirloom Tomatoes",
    description: "Sun-ripened Cherokee Purple and Brandywine tomatoes. Picked this morning.",
    photoUri: null,
    boxLocation: { lat: 37.7749, lng: -122.4194, address: "Old Mill Road Box #3" },
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
    boxLocation: { lat: 37.78, lng: -122.41, address: "Meadow Lane Box #1" },
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
    boxLocation: { lat: 37.77, lng: -122.43, address: "Creek Side Box #7" },
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
    boxLocation: { lat: 37.76, lng: -122.44, address: "Orchard Gate Box #2" },
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rawUser, rawListings, rawTx] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.user),
        AsyncStorage.getItem(STORAGE_KEYS.listings),
        AsyncStorage.getItem(STORAGE_KEYS.transactions),
      ]);

      if (rawUser) setUserState(JSON.parse(rawUser));
      
      const stored = rawListings ? JSON.parse(rawListings) : [];
      const merged = [
        ...DEMO_LISTINGS,
        ...stored.filter((s: ListingItem) => !DEMO_LISTINGS.find((d) => d.id === s.id)),
      ];
      setListings(merged);

      if (rawTx) setTransactions(JSON.parse(rawTx));
    } catch (e) {
      setListings(DEMO_LISTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  const setUser = useCallback(async (u: User | null) => {
    setUserState(u);
    if (u) {
      await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(u));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.user);
    }
  }, []);

  const addListing = useCallback(
    async (l: Omit<ListingItem, "id" | "timestamp">) => {
      const newItem: ListingItem = {
        ...l,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
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

      const tx: Transaction = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        listingId: listing.id,
        listingTitle: listing.title,
        buyerId: user.id,
        makerId: listing.makerId,
        credits: listing.creditCost,
        timestamp: Date.now(),
        type: "purchase",
      };

      const updatedUser: User = {
        ...user,
        creditBalance: user.creditBalance - listing.creditCost,
      };

      const updatedListings = listings.map((l) =>
        l.id === listing.id ? { ...l, quantity: l.quantity - 1, available: l.quantity - 1 > 0 } : l
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

  const value = useMemo(
    () => ({
      user,
      listings,
      transactions,
      isLoading,
      setUser,
      addListing,
      removeListing,
      claimListing,
      refreshListings,
    }),
    [user, listings, transactions, isLoading, setUser, addListing, removeListing, claimListing, refreshListings]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
