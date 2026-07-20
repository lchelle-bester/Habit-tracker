export interface Verse {
  text: string;
  reference: string;
}

export const VERSES: Verse[] = [
  { text: 'So run, that ye may obtain. I keep under my body, and bring it into subjection.', reference: '1 Corinthians 9:24, 27' },
  { text: 'Let us not be weary in well doing: for in due season we shall reap, if we faint not.', reference: 'Galatians 6:9' },
  { text: "It is of the Lord's mercies that we are not consumed. They are new every morning: great is thy faithfulness.", reference: 'Lamentations 3:22–23' },
  { text: 'The soul of the sluggard desireth, and hath nothing: but the soul of the diligent shall be made fat.', reference: 'Proverbs 13:4' },
  { text: 'This one thing I do: forgetting those things which are behind, I press toward the mark for the prize.', reference: 'Philippians 3:13–14' },
  { text: 'Let us run with patience the race that is set before us.', reference: 'Hebrews 12:1' },
  { text: 'The hand of the diligent shall bear rule: but the slothful shall be under tribute.', reference: 'Proverbs 12:24' },
  { text: 'The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want.', reference: 'Proverbs 21:5' },
  { text: 'He becometh poor that dealeth with a slack hand: but the hand of the diligent maketh rich.', reference: 'Proverbs 10:4' },
  { text: 'Go to the ant, thou sluggard; consider her ways, and be wise: which having no guide, provideth her meat in the summer.', reference: 'Proverbs 6:6–8' },
  { text: 'Blessed is the man that endureth temptation: for when he is tried, he shall receive the crown of life.', reference: 'James 1:12' },
  { text: 'Tribulation worketh patience; and patience, experience; and experience, hope.', reference: 'Romans 5:3–4' },
  { text: 'I have fought a good fight, I have finished my course, I have kept the faith.', reference: '2 Timothy 4:7' },
  { text: 'Be ye stedfast, unmoveable, always abounding in the work of the Lord, forasmuch as ye know that your labour is not in vain.', reference: '1 Corinthians 15:58' },
  { text: 'Let every man prove his own work, and then shall he have rejoicing in himself alone.', reference: 'Galatians 6:4' },
  { text: 'A just man falleth seven times, and riseth up again.', reference: 'Proverbs 24:16' },
  { text: 'Ye have need of patience, that, after ye have done the will of God, ye might receive the promise.', reference: 'Hebrews 10:36' },
  { text: 'Whatsoever ye do, do it heartily, as to the Lord, and not unto men.', reference: 'Colossians 3:23' },
  { text: 'Whatsoever thy hand findeth to do, do it with thy might.', reference: 'Ecclesiastes 9:10' },
  { text: 'Commit thy works unto the Lord, and thy thoughts shall be established.', reference: 'Proverbs 16:3' },
  { text: 'He that is faithful in that which is least is faithful also in much.', reference: 'Luke 16:10' },
  { text: 'Well done, thou good and faithful servant: thou hast been faithful over a few things.', reference: 'Matthew 25:21' },
  { text: 'Add to your faith virtue; and to knowledge temperance; and to temperance patience.', reference: '2 Peter 1:5–6' },
  { text: 'Bodily exercise profiteth little: but godliness is profitable unto all things.', reference: '1 Timothy 4:8' },
  { text: 'In all labour there is profit: but the talk of the lips tendeth only to penury.', reference: 'Proverbs 14:23' },
  { text: 'So built we the wall, for the people had a mind to work.', reference: 'Nehemiah 4:6' },
  { text: 'So teach us to number our days, that we may apply our hearts unto wisdom.', reference: 'Psalm 90:12' },
  { text: 'Let patience have her perfect work, that ye may be perfect and entire, wanting nothing.', reference: 'James 1:2–4' },
  { text: 'Not slothful in business; fervent in spirit; serving the Lord. Continuing instant in prayer.', reference: 'Romans 12:11–12' },
  { text: 'He that gathereth by labour shall increase.', reference: 'Proverbs 13:11' },
];

/** Deterministic daily rotation — same verse all day, advances by one each day. */
export function verseForDate(iso: string): Verse {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const start = Date.UTC(2024, 0, 1);
  const dayIndex = Math.floor((date.getTime() - start) / 86400000);
  const idx = ((dayIndex % VERSES.length) + VERSES.length) % VERSES.length;
  return VERSES[idx];
}
