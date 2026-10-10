import { SVGProps } from 'react';

interface PassengerIconProps extends SVGProps<SVGSVGElement> {
  rotation?: number;
  color?: string;
}

export default function PassengerIcon({
  rotation = 0,
  color,
  style,
  className = "w-8 h-8",
  ...props
}: PassengerIconProps) {
  return (
    <svg
      viewBox="0 0 48 82"
      fill="currentColor"
      xmlns="http://w3.org"
      stroke="#000000"
      strokeWidth={2}
      strokeLinejoin="round"
      className={className}
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'bottom center', // Matches DriverIcon pivot behavior
        color: color,
        display: 'inline-block',
        ...style,
      }}
      {...props}
    >
      {/* 1. Outer Tear-drop Shape Profile */}
      <path
        d="M 23.128 78.892 C 21.648 78.355 14.914 69.913 11.086 64.025 C 6.084 56.331 2.622 49.49 1.004 43.127 C -0.103 38.774 0.341 34.517 2.284 30.841 C 3.357 28.811 6.849 25.228 8.84 24.113 C 9.64 23.665 11.383 22.92 12.713 22.458 L 15.132 21.618 L 16.17 22.305 C 18.493 23.842 22.07 24.574 24.847 24.08 C 25.728 23.923 27.445 23.281 28.703 22.637 L 30.972 21.478 L 33.466 22.178 C 36.704 23.087 38.874 24.27 41.123 26.352 C 43.449 28.506 44.807 30.551 45.696 33.241 C 46.657 36.147 46.827 38.427 46.305 41.391 C 45.129 48.068 41.629 55.824 35.863 64.526 C 32.339 69.845 25.8 77.944 24.404 78.718 C 23.725 79.095 23.696 79.099 23.128 78.892 Z"
      />

      {/* 2. Inner Separate Path: Solid Body Layer (Fills the cutout cleanly) */}
      <path
        d="M 26.882 60.715 C 32.177 58.846 38.267 52.526 41.373 45.675 C 43.762 40.407 43.543 35.19 40.762 31.126 C 39.554 29.362 37.29 27.331 36.237 27.066 C 35.781 26.952 35.27 27.13 34.456 27.688 C 32.66 28.92 30.758 29.8 28.237 30.568 C 26.246 31.174 25.405 31.28 22.467 31.297 C 20.003 31.311 18.469 31.182 17.059 30.841 C 15.004 30.344 11.126 28.838 9.997 28.098 C 9.35 27.674 9.32 27.69 7.757 29.297 C 1.674 35.553 2.925 44.682 11.159 54.124 C 16.435 60.173 21.911 62.469 26.882 60.715 Z"
        stroke="none"
      />

      {/* 3. Top Separate Path: Pin Head */}
      <path
        d="M 19.689 21.241 C 18.065 20.658 16.111 19.128 15.163 17.7 C 11.996 12.926 13.846 6.701 19.16 4.251 C 21.339 3.245 24.252 3.266 26.498 4.302 C 28.413 5.186 30.291 7.044 31.151 8.906 C 32.015 10.778 31.974 14.661 31.071 16.504 C 30.235 18.207 28.379 20.055 26.7 20.856 C 24.968 21.683 21.456 21.876 19.689 21.241 Z"
      />
    </svg>
  );
}
