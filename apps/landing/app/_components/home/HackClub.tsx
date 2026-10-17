import Link from "next/link";

// Where LOADOUT comes from: Hack Club's facts and LOADOUT's status on the left, Jerry's reason in a framed card on the right.
// The people themselves are on the Docs team page (/docs/team).
export function HackClub() {
  return (
    <div className="sect" id="hack-club">
      <h2 className="h2">
        Where LOADOUT
        comes from
      </h2>
      <div className="hc">
        <div className="hc-facts">
          <p>
            Hack Club is a nonprofit community of teenagers who learn by making. Its You Ship, We Ship programs give prizes for projects.
          </p>
          <p>
            LOADOUT is a proposal for a program like that. It is in development, and Hack Club has not accepted it yet.
          </p>
          <div className="lnks hc-links">
            <a href="https://hackclub.com/">Explore Hack Club</a>
            <a href="https://readme.hackclub.com/ysws">Read about YSWS</a>
            <Link href="/docs/team">Who’s behind LOADOUT →</Link>
          </div>
        </div>
        <figure className="why hc-quote">
          <blockquote>
            <p>
              I love Hack Club. Through it I got a lot, and I got to know a great community. But I noticed there is no YSWS that is both general and nudges people to focus on one area, and many pay out at rates I don’t think are sustainable.
              LOADOUT pays a fair rate and adds discounts, so you aren’t just grinding for any reward: your rewards help you build faster.
            </p>
          </blockquote>
          <figcaption>
            Jerry, lead organizer
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
