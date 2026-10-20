// Every limit and rule this group invents lives in this one object. The plans select the features (see
// plans/proposals/future-platform-ui.md "Social and community" and plans/01-product-and-program.md section 53)
// but do not set comment length, idea statuses, friend-versus-follow behaviour or rate limits. Each value below
// is therefore a DRAFT PREVIEW RULE, shown as such in the UI and listed under "Unsettled by the plans" in
// SOURCES.md. Change a number here and the forms, the validators and the tests move together.

export const DRAFT_RULES = {
  /** Explore: projects per page. */
  projectsPerPage: 12,
  /** Ideas: ideas per page. */
  ideasPerPage: 8,
  /** Show & Tell: posts per page. */
  postsPerPage: 9,
  /** Friends: how many events the "activity from people you follow" list shows. There is no feed beyond this. */
  activityLimit: 10,

  commentMax: 500,

  ideaTitleMax: 80,
  ideaBodyMin: 10,
  ideaBodyMax: 600,

  postTitleMax: 80,
  postBuiltMin: 20,
  postBuiltMax: 800,
  postLearnedMax: 600,
  linkMax: 300,

  reportNoteMax: 300,

  /** Soft rate limits, counted from the timestamps of your own saved items. */
  rate: {
    commentsPerHour: 20,
    ideasPerDay: 5,
    postsPerDay: 3,
  },

  /** Friends: following is one-way and instant; a friendship needs a request and an accept. Mutual follow is not a friendship. */
  friendNeedsAccept: true,
  /** A new follow does not raise post notifications until the participant turns them on for that builder. */
  notifyOnFollowDefault: false,
  /** Blocking also removes the builder from your follows, followers, friends and pending requests. */
  blockRemovesRelations: true,
  /** Reporting hides the item for you unless you untick the box. */
  reportHidesByDefault: true,
} as const;

export const COMMUNITY_CONDUCT =
  "Be kind and be specific. Do not share personal details, keys or private addresses. Report anything that breaks these rules; reports are saved in this browser in the preview.";
