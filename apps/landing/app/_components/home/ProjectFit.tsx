
// Project fit section ported from the LOADOUT redesign reference.
export function ProjectFit() {
  return (
    <>
      <div className="pit">
        <b>
          −200 M
        </b>
        <span>
          Füllort
          <br />
          Project fit
        </span>
      </div>
      <div className="sect" id="project-fit">
        <h2 className="h2">
          Technical work
          beats the label
        </h2>
        <p className="lead">
          Reviewers look at what you built, not just what you call it.
        </p>
        <div className="lgr hi">
          <svg className="ic l" viewBox="0 0 16 16" aria-hidden="true">
            <use href="#i-check"></use>
          </svg>
          <div>
            <h4>
              Workflow command-line tool
            </h4>
            <div className="m dsc">
              Build a command that removes a repeated step from a real workflow.
            </div>
          </div>
          <span className="chip">
            Higher signal
          </span>
        </div>
        <div className="lgr hi">
          <svg className="ic l" viewBox="0 0 16 16" aria-hidden="true">
            <use href="#i-check"></use>
          </svg>
          <div>
            <h4>
              Inference runtime
            </h4>
            <div className="m dsc">
              Build software that runs a model on a device or GPU. That can show original Compute work.
            </div>
          </div>
          <span className="chip">
            Higher signal
          </span>
        </div>
        <div className="lgr lo">
          <svg className="ic l" viewBox="0 0 16 16" aria-hidden="true">
            <use href="#i-cross"></use>
          </svg>
          <div>
            <h4>
              Copied tutorial site
            </h4>
            <div className="m dsc">
              Recreating a tutorial without adding substantial technical work shows little original work.
            </div>
          </div>
          <span className="chip">
            Lower signal
          </span>
        </div>
        <div className="lgr lo">
          <svg className="ic l" viewBox="0 0 16 16" aria-hidden="true">
            <use href="#i-cross"></use>
          </svg>
          <div>
            <h4>
              Basic AI chat screen
            </h4>
            <div className="m dsc">
              A simple screen around an AI model adds little technical work on its own.
            </div>
          </div>
          <span className="chip">
            Lower signal
          </span>
        </div>
        <div className="chips">
          <span className="chip">
            Originality
          </span>
          <span className="chip">
            Technical Depth
          </span>
          <span className="chip">
            Execution
          </span>
          <span className="chip">
            Documentation
          </span>
        </div>
        <p className="note">
          If it fits, reviewers assess Originality, Technical Depth, Execution, and Documentation.
        </p>
      </div>
    </>
  );
}
