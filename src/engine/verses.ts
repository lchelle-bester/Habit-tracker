import { dayOfYear } from './dates'
import type { ISODate, Verse } from './types'

// KJV (public domain). Chosen for register: discipline, perseverance, daily
// faithfulness — not general comfort or encouragement verses.
export const VERSES: Verse[] = [
  { text: 'The soul of the sluggard desireth, and hath nothing: but the soul of the diligent shall be made fat.', reference: 'Proverbs 13:4' },
  { text: 'And let us not be weary in well doing: for in due season we shall reap, if we faint not.', reference: 'Galatians 6:9' },
  { text: "It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.", reference: 'Lamentations 3:22-23' },
  { text: 'Brethren, I count not myself to have apprehended: but this one thing I do, forgetting those things which are behind, and reaching forth unto those things which are before, I press toward the mark for the prize of the high calling of God in Christ Jesus.', reference: 'Philippians 3:13-14' },
  { text: 'Know ye not that they which run in a race run all, but one receiveth the prize? So run, that ye may obtain.', reference: '1 Corinthians 9:24' },
  { text: 'But I keep under my body, and bring it into subjection: lest that by any means, when I have preached to others, I myself should be a castaway.', reference: '1 Corinthians 9:27' },
  { text: 'Go to the ant, thou sluggard; consider her ways, and be wise:', reference: 'Proverbs 6:6' },
  { text: 'Whatsoever thy hand findeth to do, do it with thy might; for there is no work, nor device, nor knowledge, nor wisdom, in the grave, whither thou goest.', reference: 'Ecclesiastes 9:10' },
  { text: '...let us lay aside every weight, and the sin which doth so easily beset us, and let us run with patience the race that is set before us.', reference: 'Hebrews 12:1' },
  { text: 'I have fought a good fight, I have finished my course, I have kept the faith:', reference: '2 Timothy 4:7' },
  { text: 'And whatsoever ye do, do it heartily, as to the Lord, and not unto men;', reference: 'Colossians 3:23' },
  { text: 'So teach us to number our days, that we may apply our hearts unto wisdom.', reference: 'Psalm 90:12' },
  { text: 'Blessed is the man that endureth temptation: for when he is tried, he shall receive the crown of life, which the Lord hath promised to them that love him.', reference: 'James 1:12' },
  { text: 'Therefore, my beloved brethren, be ye stedfast, unmoveable, always abounding in the work of the Lord, forasmuch as ye know that your labour is not in vain in the Lord.', reference: '1 Corinthians 15:58' },
  { text: 'Not slothful in business; fervent in spirit; serving the Lord;', reference: 'Romans 12:11' },
  { text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.', reference: 'Proverbs 3:5-6' },
  { text: 'Commit thy works unto the LORD, and thy thoughts shall be established.', reference: 'Proverbs 16:3' },
  { text: 'He becometh poor that dealeth with a slack hand: but the hand of the diligent maketh rich.', reference: 'Proverbs 10:4' },
  { text: 'The hand of the diligent shall bear rule: but the slothful shall be under tribute.', reference: 'Proverbs 12:24' },
  { text: 'The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want.', reference: 'Proverbs 21:5' },
  { text: 'He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much.', reference: 'Luke 16:10' },
  { text: 'For ye have need of patience, that, after ye have done the will of God, ye might receive the promise.', reference: 'Hebrews 10:36' },
  { text: 'For bodily exercise profiteth little: but godliness is profitable unto all things, having promise of the life that now is, and of that which is to come.', reference: '1 Timothy 4:8' },
  { text: 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.', reference: 'Joshua 1:9' },
  { text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.', reference: 'Isaiah 40:31' },
  { text: 'Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof.', reference: 'Matthew 6:34' },
  { text: 'Be strong and of a good courage, fear not, nor be afraid of them: for the LORD thy God, he it is that doth go with thee; he will not fail thee, nor forsake thee.', reference: 'Deuteronomy 31:6' },
  { text: 'Boast not thyself of to morrow; for thou knowest not what a day may bring forth.', reference: 'Proverbs 27:1' },
  { text: 'But let every man prove his own work, and then shall he have rejoicing in himself alone, and not in another.', reference: 'Galatians 6:4' },
  { text: 'Whether therefore ye eat, or drink, or whatsoever ye do, do all to the glory of God.', reference: '1 Corinthians 10:31' },
]

/** Deterministic by calendar day — same verse all day regardless of when the app is opened. */
export function getVerseForDate(date: ISODate, verses: Verse[] = VERSES): Verse {
  const idx = (dayOfYear(date) - 1) % verses.length
  return verses[idx]
}
