---
title: "AI & team contributions"
description: "AI, libraries and teammates are allowed. Tell us who did what."
group: "BUILD & REVIEW"
order: 90
status: draft
---

Most projects involve somebody else's work: a library, a tutorial, a teammate or an AI assistant. Tell us how that help fits into your build so the reviewer can see what you contributed and check the parts you're claiming.

## AI help

AI help is allowed. Though you need to provide context and explanation. Explain what it helped with and what you did with the output. “Used AI” doesn't tell us whether it suggested a variable name or wrote the first version of a parser.

Lets use the parser as an example, a useful disclosure might be: “An assistant drafted the command parser. I changed the error handling, added input-length checks and tested malformed commands against the device.” That gives the reviewer specific work to inspect and he can verify if the usage of AI in this case is appropriate. Also whenever you use AI, you should be able to explain the result you're shipping though this should be obvious as you dont learn without understanding.

As for a ai percentage limit, we don't have one at the moment. Using AI doesn't automatically disqualify a project, ofthen times there are cases of greate projects where AI is used effectively and just because you used Ai these shouldnt be disqualified.


## Borrowed work and dependencies

As for using any dependencies, try to credit the original authors of code, designs, libraries and tutorials, and follow their licenses. Though it isnt needed it would also be highly appreciated if you could provide a link to the original work in your README or journal. So the reviewer can see what you used and how it fits into your project. 


## Can i build with a teammate?

Yes, you can build together in the same repository. but each person keeps their own hours and journal, describing the contribution they made. 

Suppose one person designs the board and another writes the firmware. They can submit work on the same device, with different evidence and Track XP splits. The board designer should show the circuit decisions and measurements; the firmware developer should explain the code and its tests. Neither person gets paid for the other's hours.

When you work on the same task together, explain the collaboration. Describe who investigated, implemented or tested each part instead of claiming the whole implementation independently.

## What to say in a ship

Put these notes alongside the relevant work in your submission and README. A reviewer should be able to follow a claim to its source and understand whose work they're opening.

Use [Tracking & evidence](/docs/tracking) for the records and [Project review](/docs/review) for how they are assessed.
