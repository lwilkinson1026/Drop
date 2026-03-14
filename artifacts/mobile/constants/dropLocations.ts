export interface DropLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  description: string;
}

export const DROP_LOCATIONS: DropLocation[] = [
  {
    id: "lynch-lane-yakima",
    name: "Lynch Lane Box",
    address: "791 Lynch Lane",
    city: "Yakima",
    state: "WA",
    lat: 46.6021,
    lng: -120.5059,
    description: "Community swap box at the Lynch Lane trailhead parking area. Look for the green wooden box near the main entrance.",
  },
];

export const CITIES_SUPPORTED = ["Yakima"];

export function getLocationsForCity(city: string): DropLocation[] {
  return DROP_LOCATIONS.filter((l) => l.city === city);
}
