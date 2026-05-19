export interface VideoQuestion {
  id: number;
  category: string;
  text: string;
}

export const VIDEO_QUESTIONS: VideoQuestion[] = [
  {
    id: 1,
    category: 'CATEGORY',
    text: 'Start by telling us — why are you shopping for Multivitamins today?',
  },
  {
    id: 2,
    category: 'RETAILER',
    text: 'Why did you choose this retailer for this purchase?',
  },
  {
    id: 3,
    category: 'TRIP TYPE',
    text: 'Is this a regular shopping trip, or a one-off trip for this category? If one-off, what brought you in — special occasion, immediate need, running out?',
  },
  {
    id: 4,
    category: 'BRAND',
    text: 'Did you have a particular product, brand, or type in mind? Which brands of Multivitamins are you considering today, and why?',
  },
  {
    id: 5,
    category: 'FINDABILITY',
    text: 'How was your experience finding the products you were looking for? Positive, Neutral, or Negative — and why do you feel that way?',
  },
  {
    id: 6,
    category: 'ASSORTMENT',
    text: 'How do you feel about the assortment of products offered here? Positive, Neutral, or Negative — please explain why.',
  },
  {
    id: 7,
    category: 'ORGANIZATION',
    text: 'As you walk through the section, share your thoughts on how products are organised. What do you think about the layout? Positive, Neutral, or Negative — please explain.',
  },
  {
    id: 8,
    category: 'IMPROVEMENT',
    text: 'Is there anything that would improve your shopping experience in this section?',
  },
  {
    id: 9,
    category: 'DECISION',
    text: 'Show us what you have decided to buy and tell us why. If you decided not to buy anything, please explain why.',
  },
];

export const TOTAL_VIDEO_QUESTIONS = VIDEO_QUESTIONS.length;
