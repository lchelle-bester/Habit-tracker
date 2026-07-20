import { dayOfYear } from './dates'
import type { ISODate, Verse } from './types'

// New Living Translation (NLT), copyright Tyndale House Publishers — used here
// for personal, single-device, non-commercial use only. Chosen for register:
// discipline, perseverance, daily faithfulness — not general comfort verses.
export const VERSES: Verse[] = [
  { text: 'Lazy people want much but get little, but those who work hard will prosper.', reference: 'Proverbs 13:4 (NLT)' },
  { text: "So let's not get tired of doing what is good. At just the right time we will reap a harvest of blessing if we don't give up.", reference: 'Galatians 6:9 (NLT)' },
  { text: 'The faithful love of the Lord never ends! His mercies never cease. Great is his faithfulness; his mercies begin afresh each morning.', reference: 'Lamentations 3:22-23 (NLT)' },
  { text: 'No, dear brothers and sisters, I have not achieved it, but I focus on this one thing: Forgetting the past and looking forward to what lies ahead, I press on to reach the end of the race and receive the heavenly prize for which God, through Christ Jesus, is calling us.', reference: 'Philippians 3:13-14 (NLT)' },
  { text: "Don't you realize that in a race everyone runs, but only one person gets the prize? So run to win!", reference: '1 Corinthians 9:24 (NLT)' },
  { text: 'I discipline my body like an athlete, training it to do what it should. Otherwise, I fear that after preaching to others I myself might be disqualified.', reference: '1 Corinthians 9:27 (NLT)' },
  { text: 'Take a lesson from the ants, you lazybones. Learn from their ways and become wise!', reference: 'Proverbs 6:6 (NLT)' },
  { text: 'Whatever you do, do well. For when you go to the grave, there will be no work or planning or knowledge or wisdom.', reference: 'Ecclesiastes 9:10 (NLT)' },
  { text: 'Therefore, since we are surrounded by such a huge crowd of witnesses to the life of faith, let us strip off every weight that slows us down, especially the sin that so easily trips us up. And let us run with endurance the race God has set before us.', reference: 'Hebrews 12:1 (NLT)' },
  { text: 'I have fought the good fight, I have finished the race, and I have remained faithful.', reference: '2 Timothy 4:7 (NLT)' },
  { text: 'Work willingly at whatever you do, as though you were working for the Lord rather than for people.', reference: 'Colossians 3:23 (NLT)' },
  { text: 'Teach us to realize the brevity of life, so that we may grow in wisdom.', reference: 'Psalm 90:12 (NLT)' },
  { text: 'God blesses those who patiently endure testing and temptation. Afterward they will receive the crown of life that God has promised to those who love him.', reference: 'James 1:12 (NLT)' },
  { text: 'So, my dear brothers and sisters, be strong and immovable. Always work enthusiastically for the Lord, for you know that nothing you do for the Lord is ever useless.', reference: '1 Corinthians 15:58 (NLT)' },
  { text: 'Never be lazy, but work hard and serve the Lord enthusiastically.', reference: 'Romans 12:11 (NLT)' },
  { text: 'Trust in the LORD with all your heart; do not depend on your own understanding. Seek his will in all you do, and he will show you which path to take.', reference: 'Proverbs 3:5-6 (NLT)' },
  { text: 'Commit your actions to the LORD, and your plans will succeed.', reference: 'Proverbs 16:3 (NLT)' },
  { text: 'Lazy people are soon poor; hard workers get rich.', reference: 'Proverbs 10:4 (NLT)' },
  { text: 'Work hard and become a leader; be lazy and become a slave.', reference: 'Proverbs 12:24 (NLT)' },
  { text: 'Good planning and hard work lead to prosperity, but hasty shortcuts lead to poverty.', reference: 'Proverbs 21:5 (NLT)' },
  { text: "If you are faithful in little things, you will be faithful in large ones. But if you are dishonest in little things, you won't be honest with greater responsibilities.", reference: 'Luke 16:10 (NLT)' },
  { text: "Patient endurance is what you need now, so that you will continue to do God's will. Then you will receive all that he has promised.", reference: 'Hebrews 10:36 (NLT)' },
  { text: 'Physical training is good, but training for godliness is much better, promising benefits in this life and in the life to come.', reference: '1 Timothy 4:8 (NLT)' },
  { text: 'This is my command—be strong and courageous! Do not be afraid or discouraged. For the LORD your God is with you wherever you go.', reference: 'Joshua 1:9 (NLT)' },
  { text: 'But those who trust in the LORD will find new strength. They will soar high on wings like eagles. They will run and not grow weary. They will walk and not faint.', reference: 'Isaiah 40:31 (NLT)' },
  { text: "So don't worry about tomorrow, for tomorrow will bring its own worries. Today's trouble is enough for today.", reference: 'Matthew 6:34 (NLT)' },
  { text: 'So be strong and courageous! Do not be afraid and do not panic before them. For the LORD your God will personally go ahead of you. He will neither fail you nor abandon you.', reference: 'Deuteronomy 31:6 (NLT)' },
  { text: "Don't brag about tomorrow, since you don't know what the day will bring.", reference: 'Proverbs 27:1 (NLT)' },
  { text: "Pay careful attention to your own work, for then you will get the satisfaction of a job well done, and you won't need to compare yourself to anyone else.", reference: 'Galatians 6:4 (NLT)' },
  { text: 'So whether you eat or drink, or whatever you do, do it all for the glory of God.', reference: '1 Corinthians 10:31 (NLT)' },
]

/** Deterministic by calendar day — same verse all day regardless of when the app is opened. */
export function getVerseForDate(date: ISODate, verses: Verse[] = VERSES): Verse {
  const idx = (dayOfYear(date) - 1) % verses.length
  return verses[idx]
}
