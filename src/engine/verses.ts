export interface Verse {
  text: string;
  reference: string;
}

// ~30 verses on discipline, perseverance, and daily faithfulness.
export const VERSES: Verse[] = [
  { text: 'Do you not know that in a race all the runners run, but only one gets the prize? Run in such a way as to get the prize.', reference: '1 Corinthians 9:24' },
  { text: 'Everyone who competes in the games goes into strict training. They do it to get a crown that will not last, but we do it to get a crown that will last forever.', reference: '1 Corinthians 9:25' },
  { text: 'I do not run like someone running aimlessly; I do not fight like a boxer beating the air.', reference: '1 Corinthians 9:26' },
  { text: 'I strike a blow to my body and make it my slave so that I myself will not be disqualified for the prize.', reference: '1 Corinthians 9:27' },
  { text: 'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.', reference: 'Galatians 6:9' },
  { text: 'Because of the Lord’s great love we are not consumed, for his compassions never fail. They are new every morning.', reference: 'Lamentations 3:22–23' },
  { text: 'The hand of the diligent will rule, while the slothful will be put to forced labor.', reference: 'Proverbs 12:24' },
  { text: 'The soul of the lazy craves and gets nothing, while the soul of the diligent is richly supplied.', reference: 'Proverbs 13:4' },
  { text: 'Brothers, I do not consider myself yet to have taken hold of it. But one thing I do: forgetting what is behind and reaching forward to what is ahead.', reference: 'Philippians 3:13' },
  { text: 'I press on toward the goal to win the prize for which God has called me heavenward in Christ Jesus.', reference: 'Philippians 3:14' },
  { text: 'Whatever you do, work at it with all your heart, as working for the Lord, not for men.', reference: 'Colossians 3:23' },
  { text: 'Let us run with perseverance the race marked out for us, fixing our eyes on Jesus.', reference: 'Hebrews 12:1–2' },
  { text: 'Consider it pure joy whenever you face trials, because the testing of your faith produces perseverance.', reference: 'James 1:2–3' },
  { text: 'Let perseverance finish its work so that you may be mature and complete, not lacking anything.', reference: 'James 1:4' },
  { text: 'Blessed is the one who perseveres under trial. Having stood the test, that person will receive the crown of life.', reference: 'James 1:12' },
  { text: 'She gets up while it is still night; she provides food for her family.', reference: 'Proverbs 31:15' },
  { text: 'In all toil there is profit, but mere talk tends only to poverty.', reference: 'Proverbs 14:23' },
  { text: 'Commit to the Lord whatever you do, and he will establish your plans.', reference: 'Proverbs 16:3' },
  { text: 'The plans of the diligent lead surely to abundance, but everyone who is hasty comes only to poverty.', reference: 'Proverbs 21:5' },
  { text: 'Do not despise these small beginnings, for the Lord rejoices to see the work begin.', reference: 'Zechariah 4:10' },
  { text: 'Whoever can be trusted with very little can also be trusted with much.', reference: 'Luke 16:10' },
  { text: 'Being confident of this, that he who began a good work in you will carry it on to completion.', reference: 'Philippians 1:6' },
  { text: 'Not that I have already attained this, or am already perfect, but I press on to make it my own.', reference: 'Philippians 3:12' },
  { text: 'We know that suffering produces perseverance; perseverance, character; and character, hope.', reference: 'Romans 5:3–4' },
  { text: 'Therefore, since we are surrounded by so great a cloud of witnesses, let us also lay aside every weight.', reference: 'Hebrews 12:1' },
  { text: 'But those who hope in the Lord will renew their strength. They will run and not grow weary.', reference: 'Isaiah 40:31' },
  { text: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you.', reference: 'Joshua 1:9' },
  { text: 'I can do all this through him who gives me strength.', reference: 'Philippians 4:13' },
  { text: 'Have I not commanded you? Be strong and courageous. Do not be frightened, and do not be dismayed.', reference: 'Joshua 1:9' },
  { text: 'Whatever your hand finds to do, do it with all your might.', reference: 'Ecclesiastes 9:10' },
];

/** Deterministic rotation keyed by day, so the same verse shows all day and
 * a new one appears tomorrow — no randomness, no repeats within a cycle. */
export function verseForDate(dateISO: string): Verse {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dayNumber = Math.floor(new Date(y, m - 1, d).getTime() / 86_400_000);
  const index = ((dayNumber % VERSES.length) + VERSES.length) % VERSES.length;
  return VERSES[index];
}
