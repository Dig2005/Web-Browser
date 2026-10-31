import {
  ArrowRight,
  Building2,
  Newspaper,
  Rocket,
  Umbrella,
} from "lucide-react";

import { useBrowser } from "../../context/BrowserContext";
import { secondaryStories } from "../../data/dashboardData";

const storyIcons = {
  "story-1": Building2,
  "story-2": Rocket,
  "story-3": Umbrella,
};

const storyLinks = {
  "story-1":
    "https://www.google.com/search?q=global+markets+positive+growth&tbm=nws",

  "story-2":
    "https://www.google.com/search?q=latest+space+mission+milestone&tbm=nws",

  "story-3":
    "https://www.google.com/search?q=top+travel+destinations+2026&tbm=nws",
};

function TopStories({ styles }) {
  const { navigate } = useBrowser();

  const openStory = async (url) => {
    if (!url) {
      return;
    }

    await navigate(url);
  };

  const openAllStories = async () => {
    await navigate("https://news.google.com/");
  };

  const openFeaturedStory = async () => {
    await navigate(
      "https://www.google.com/search?q=latest+technology+innovations&tbm=nws",
    );
  };

  return (
    <section
      id="top-stories"
      className={`${styles.panel} ${styles.topStories}`}
    >
      <header className={styles.panelHeader}>
        <div>
          <Newspaper size={19} />
          <h2>Top Stories</h2>
        </div>

        <button
          type="button"
          onClick={openAllStories}
          aria-label="View all news stories"
        >
          View all
          <ArrowRight size={15} />
        </button>
      </header>

      <div className={styles.storiesContent}>
        <article
          className={`${styles.featuredStory} ${styles.clickableCard}`}
          onClick={openFeaturedStory}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFeaturedStory();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className={styles.featuredVisual}>
            <span className={styles.cityBuildingOne} />
            <span className={styles.cityBuildingTwo} />
            <span className={styles.cityBuildingThree} />
            <span className={styles.citySun} />
          </div>

          <div className={styles.featuredStoryText}>
            <h3>Tech innovations shaping a smarter future</h3>

            <p>
              Discover how emerging technology is transforming everyday digital
              experiences.
            </p>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openFeaturedStory();
              }}
            >
              Read more
            </button>
          </div>
        </article>

        <div className={styles.secondaryStories}>
          {secondaryStories.map((story) => {
            const Icon = storyIcons[story.id] ?? Newspaper;
            const storyUrl = storyLinks[story.id];

            return (
              <article
                key={story.id}
                className={`${styles.secondaryStory} ${styles.clickableCard}`}
                onClick={() => openStory(storyUrl)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openStory(storyUrl);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div
                  className={`${styles.storyThumbnail} ${
                    styles[`storyThumbnail${story.color}`]
                  }`}
                >
                  <Icon size={23} />
                </div>

                <div>
                  <h3>{story.title}</h3>
                  <p>{story.time}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default TopStories;
