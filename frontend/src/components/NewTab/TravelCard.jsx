import { ArrowRight, Image } from "lucide-react";

import { useEffect, useState } from "react";

import { useBrowser } from "../../context/BrowserContext";

const destinations = [
  {
    id: "mountains",
    titleFirst: "Explore",
    titleSecond: "the Extraordinary",
    description: "Breathtaking places. Unforgettable journeys.",
    query: "best mountain destinations",
  },
  {
    id: "beaches",
    titleFirst: "Discover",
    titleSecond: "Beautiful Beaches",
    description: "Clear water, open skies and peaceful escapes.",
    query: "best beach destinations",
  },
  {
    id: "cities",
    titleFirst: "Experience",
    titleSecond: "Iconic Cities",
    description: "Architecture, food, culture and memorable streets.",
    query: "best city travel destinations",
  },
  {
    id: "adventure",
    titleFirst: "Start",
    titleSecond: "Your Adventure",
    description: "Plan an exciting journey beyond the ordinary.",
    query: "best adventure travel destinations",
  },
];

function TravelCard({ styles }) {
  const { navigate } = useBrowser();
  const [activeIndex, setActiveIndex] = useState(0);

  const activeDestination = destinations[activeIndex];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % destinations.length);
    }, 6000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const exploreDestination = async () => {
    await navigate(
      `https://www.google.com/travel/search?q=${encodeURIComponent(
        activeDestination.query,
      )}`,
    );
  };

  return (
    <section
      id="travel-inspiration"
      className={`${styles.panel} ${styles.travelCard}`}
    >
      <header className={styles.panelHeader}>
        <div>
          <Image size={19} />
          <h2>Your Travel Inspiration</h2>
        </div>

        <div
          className={styles.carouselDots}
          role="tablist"
          aria-label="Travel destinations"
        >
          {destinations.map((destination, index) => (
            <button
              key={destination.id}
              type="button"
              className={index === activeIndex ? styles.activeDot : ""}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show travel slide ${index + 1}`}
              aria-selected={index === activeIndex}
              role="tab"
            />
          ))}
        </div>
      </header>

      <div
        className={`${styles.travelVisual} ${
          styles[`travelSlide${activeIndex + 1}`] || ""
        }`}
      >
        <div className={styles.travelSun} />
        <div className={styles.travelMountainBack} />
        <div className={styles.travelMountainFront} />
        <div className={styles.travelLake} />

        <div className={styles.travelText}>
          <h3>
            {activeDestination.titleFirst}
            <br />
            {activeDestination.titleSecond}
          </h3>

          <p>{activeDestination.description}</p>
        </div>

        <button type="button" onClick={exploreDestination}>
          Explore now
          <ArrowRight size={15} />
        </button>
      </div>
    </section>
  );
}

export default TravelCard;
