# Frontend UI and Design System (Deep Fill)

## Tailwind v4 Configuration Layer
AnyLet leverages the **Tailwind CSS v4** engine without a `tailwind.config.js`. The entire design system is injected via the `@theme` directive in `src/index.css`.

### Structural Architecture
- **CSS Variables**: `src/index.css` maps primitive variables (e.g., `--color-primary`) to the Tailwind utility engine.
- **Breakpoints**: The responsive design utilizes standard Tailwind breakpoints (`md:`, `lg:`) to conditionally mount/unmount the bottom navigation bar (`md:hidden`) versus the desktop header (`hidden md:flex`).
- **Dark Mode**: Configured via `@custom-variant dark`. Components use arbitrary values like `dark:bg-[#1A1D24]` to achieve a deep, premium OLED-style contrast.

---

## Component Interfaces & Internal State

### [[src/components/PropertyCard.jsx]]
The atomic unit of the AnyLet marketplace, rendering an individual listing with an image slider, core metadata, and save-to-favorites functionality.

#### Expected Props Interface
```javascript
{
  property: {
    id: string,
    title: string,
    rent: number | string,
    area: string,
    beds: number,
    baths: number,
    sqft: number,
    images: string[], // Cloudinary URLs
    type: string,
    isVerified: boolean,
    utilitiesCost: number
  }
}
```

#### Internal State Management
- `useState`: `activeImageIndex` (number) tracks the currently visible image in the horizontal carousel.
- `useContext/Custom Hook`: `useSavedProperties()` provides `isSaved` boolean and `toggleSaveProperty` mutation function mapping to the local storage or user document.

#### User Flow (onClick)
- **Image Arrows**: Clicking `<ChevronRight>` calls `nextImage(e)`, which increments `activeImageIndex` with `e.stopPropagation()` preventing the entire card from navigating.
- **Save Icon (Heart)**: Triggers Framer Motion `heartVariants` (scale pop) and calls the mutation hook.
- **Card Body**: The root component is wrapped in a `react-router-dom` `<Link>` pushing the user to `/property/${id}`.

### [[src/components/BookPropertyModal.jsx]]
A critical conversion point modal triggered from `PropertyDetails.jsx`. 

#### Internal State Management
- Tracks `months` (subscription term length) and `onsiteVerification` (boolean add-on).
- Manages an internal `isSubmitting` boolean to disable the confirmation button and show a spinner.

#### User Flow (Submission)
When the user clicks "Confirm Booking":
1. The modal disables its inputs.
2. It makes a `POST` request to `[[api/create-payment-intent.js]]` passing `{ propertyId, bookingType: 'deposit' }`.
3. The server responds with a `referenceCode` (e.g., `ANYLET-XXXX`).
4. The modal transitions to a "Payment Instructions" view, displaying the reference code and the target bKash/Nagad number, waiting for the webhook to reconcile.

---

## The Global Shell 

### [[src/App.jsx]]
The root router orchestrator.

- **Props**: None. Mounts directly inside `main.jsx`.
- **State**: Uses `React.Suspense` to handle the asynchronous loading of route chunks.
- **Layout Logic**: Wraps all routes in `AnimatePresence` allowing `[[src/components/PageWrapper.jsx]]` to execute page-exit animations before the DOM nodes are destroyed.
