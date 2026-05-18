# Vesper

**Discover the city's best nights.**

Vesper is a premium nightlife social discovery app designed for curated bar exploration, elegant check-ins, saved places, and lightweight social discovery around nightlife taste.

## About

Vesper explores what a refined mobile experience for urban nightlife could feel like: calm, visual, social, and intentionally curated. The app helps users discover high-quality bars, save favorite places, light up visited venues, and build a personal nightlife profile over time.

This MVP focuses on product structure, interaction flow, and a polished iOS-style prototype experience using mock data only.

## Features

- Home discovery feed with curated bar cards
- Bar detail page with venue information, tags, and reviews
- Check-in / Light up flow for visited places
- Remove visited state
- Saved places with synced bookmark state
- Profile sync for visited and saved counts
- Zustand local state management
- Responsive Expo Go prototype

## Tech Stack

- Expo
- React Native
- TypeScript
- Expo Router
- Zustand
- NativeWind

## Screenshots

> Screenshots will be added as the MVP UI stabilizes.

![Home](./screenshots/home.png)
![Detail](./screenshots/detail.png)
![Profile](./screenshots/profile.png)

## Project Structure

```text
app/          Expo Router routes, tabs, and dynamic bar detail pages
components/   Reusable UI components
stores/       Zustand local state stores
data/         Mock bar data and typed content models
assets/       Static app assets
```

## Development

Install dependencies:

```bash
npm install
```

The Expo development server is managed locally by the project owner.

## Roadmap

- Publish flow for sharing nightlife experiences
- Social discovery cards and lightweight matching
- Map exploration
- Backend integration
- Authentication
- Real geolocation
- Reviews and richer venue content

## License

MIT
