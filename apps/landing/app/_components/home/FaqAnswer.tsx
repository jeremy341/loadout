export function FaqAnswer({ answer, helpUrl }: { answer: string; helpUrl: string }) {
  const helpMention = "#loadout-help";
  const mentionIndex = answer.indexOf(helpMention);

  if (mentionIndex === -1) return answer;

  return (
    <>
      {answer.slice(0, mentionIndex)}
      <a href={helpUrl}>{helpMention}</a>
      {answer.slice(mentionIndex + helpMention.length)}
    </>
  );
}
