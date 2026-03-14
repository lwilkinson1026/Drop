// Stub for react-native-maps on web platform
import React from "react";
import { View } from "react-native";

const MapView = React.forwardRef(({ children, style }, ref) => (
  React.createElement(View, { style }, children)
));

MapView.displayName = "MapView";

export default MapView;

export const Marker = ({ children }) => React.createElement(View, {}, children);
export const Callout = ({ children }) => React.createElement(View, {}, children);
export const Circle = () => null;
export const Polygon = () => null;
export const Polyline = () => null;
