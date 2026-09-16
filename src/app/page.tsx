import { Oswald } from "next/font/google";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["300", "500", "700"],
  variable: "--font-oswald",
});

const guides = [
  {
    number: "№ 001",
    title: "Star Trek Galactic Atlas",
    href: "https://joegrigsby.github.io/mirr/star-trek-galaxy-flythrough.html",
  },
  {
    number: "№ 002",
    title: "Global Music Atlas",
    href: "https://joegrigsby.github.io/mirr/global-music-atlas.html",
  },
  {
    number: "№ 003",
    title: "Alcatraz Island Atlas",
    href: "https://joegrigsby.github.io/mirr/alcatraz-island-atlas.html",
  },
  {
    number: "№ 004",
    title: "Banned Books Timeline",
    href: "https://joegrigsby.github.io/mirr/banned-books-field-guide.html",
  },
];

export default function Home() {
  return (
    <main className={`${oswald.variable} home`}>
      <h1>
        Story Field
        <br />
        Guide Projects
      </h1>
      <p className="tagline">Go Exploring</p>
      <ul className="guideList">
        {guides.map((guide) => (
          <li key={guide.number}>
            {guide.href ? (
              <a className="guideCard" href={guide.href}>
                <span className="guideNumber">Field Guide {guide.number}</span>
                <span className="guideTitle">{guide.title}</span>
              </a>
            ) : (
              <div className="guideCard guideCard--disabled">
                <span className="guideNumber">Field Guide {guide.number}</span>
                <span className="guideTitle">{guide.title}</span>
                <span className="comingSoon">Link coming soon</span>
              </div>
            )}
          </li>
        ))}
      </ul>
      <footer className="siteFooter">
        Built with AI assistance (Anthropic Claude, OpenAI ChatGPT)
      </footer>
    </main>
  );
}
