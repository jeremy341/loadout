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
            Hack Club is a nonprofit community of teenagers who learn by making. Its You Ship, We Ship programs give prizes for projects, helping young builders get tools and resources to keep creating.
          </p>
          <p>
            LOADOUT grew out of that community. It brings together four tracks: Tools, Systems, Compute, and Hardware. You can explore different areas or focus on one, with your track levels carrying forward between projects.
          </p>
          <p>
            Projects earn Ore to spend on gear, while track progression unlocks discounts. That means each build can help you get the equipment for the next one.
          </p>
          <p>
            LOADOUT is currently in development. It is a proposal, and Hack Club has not accepted it yet.
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
              While being part of Hack Club, I kept wishing there was a YSWS that felt more interactive, where you could get invested in what was happening instead of just submitting a project and waiting for a reward.
            </p>
            <p>
              A payout rate alone doesn’t give people much reason to stick around. You build, save up, buy what you want, and then what? With LOADOUT, your rates start low, but your tracks level up as you build, making gear in those tracks cheaper. Those discounts help you afford the tools for your next project.
            </p>
            <p>
              Then there’s Orry, the mole on the homepage, and Goose Lee, our duck. Kernel, our community manager, came up with Orry’s name and the idea for Goose Lee. I expanded their stories from there, and now we’re working on turning Goose into a community bot that rewards taking part in Slack. I want people to have a reason to hang out in #loadout between projects too. Writing their stories has been one of my favorite parts of making LOADOUT, and I hope people get just as attached to them as I am.
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
